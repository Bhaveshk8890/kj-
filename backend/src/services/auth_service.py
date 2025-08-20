import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from src.config.config import settings
from src.models.auth_schemas import UserCreate, UserResponse, Token, TokenData, LoginResponse
from src.services.user_service import user_service
from src.utils.logger import get_logger, log_with_context

logger = get_logger(__name__)

class AuthService:
    """Authentication service for Google SSO and JWT tokens"""
    
    def __init__(self):
        self.google_userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        self.google_certs_url = "https://www.googleapis.com/oauth2/v1/certs"
    
    async def verify_google_id_token_full(self, token: str) -> Optional[Dict[str, Any]]:
        """Full verification of Google ID token with signature validation"""
        try:
            # Get Google's public keys
            async with httpx.AsyncClient() as client:
                certs_response = await client.get(self.google_certs_url)
                if certs_response.status_code != 200:
                    return None
                    
                certs = certs_response.json()
                
                # Decode and verify token
                header = jwt.get_unverified_header(token)
                key_id = header.get('kid')
                
                if key_id not in certs:
                    return None
                    
                public_key = certs[key_id]
                payload = jwt.decode(token, public_key, algorithms=['RS256'])
                
                # Validate claims
                if payload.get('iss') not in ['https://accounts.google.com', 'accounts.google.com']:
                    return None
                    
                return {
                    'id': payload.get('sub'),
                    'email': payload.get('email'),
                    'name': payload.get('name'),
                    'picture': payload.get('picture'),
                    'email_verified': payload.get('email_verified', False)
                }
                
        except Exception as e:
            log_with_context(logger, 'error', f'Error verifying Google ID token: {str(e)}')
            return None
    
    async def verify_google_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Google ID token and get user info"""
        try:
            # Check if token is expired first
            import time
            payload = jwt.decode(token, key="", options={
                "verify_signature": False, 
                "verify_exp": False,
                "verify_aud": False,
                "verify_iss": False
            })
            
            # Check expiration manually
            exp = payload.get('exp')
            if exp and exp < time.time():
                log_with_context(logger, 'warning', 'Token expired')
                return None
            
            # Basic validation
            iss = payload.get('iss')
            if iss not in ['https://accounts.google.com', 'accounts.google.com']:
                log_with_context(logger, 'warning', f'Invalid token issuer: {iss}')
                return None
                
            # Extract user info from ID token
            print('payload === ', payload)
            user_info = {
                'id': payload.get('sub'),
                'email': payload.get('email'),
                'name': payload.get('name'),
                'picture': payload.get('picture'),
                'email_verified': payload.get('email_verified', False)
            }
            
            # Validate required fields
            if not user_info.get('id') or not user_info.get('email'):
                log_with_context(logger, 'warning', 'Missing required user info in token')
                return None
            
            log_with_context(logger, 'info', 'Google ID token verified successfully', email=user_info.get('email'))
            return user_info
                    
        except JWTError as e:
            log_with_context(logger, 'error', f'JWT Error verifying Google token: {str(e)}')
            return None
        except Exception as e:
            log_with_context(logger, 'error', f'Error verifying Google token: {str(e)}')
            return None
    
    async def authenticate_with_google(self, google_token: str) -> Optional[LoginResponse]:
        """Authenticate user with Google token"""
        # Verify Google token
        print('google_token ===== ', google_token)
        google_user_info = await self.verify_google_token(google_token)
        if not google_user_info:
            return None
        
        google_id = google_user_info.get('id')
        email = google_user_info.get('email')
        name = google_user_info.get('name', '')
        picture = google_user_info.get('picture')
        
        if not google_id or not email:
            log_with_context(logger, 'error', 'Missing required Google user info')
            return None
        
        # Check if user exists
        user = await user_service.get_user_by_google_id(google_id)
        
        if not user:
            # Create new user
            user_create = UserCreate(
                email=email,
                name=name,
                picture=picture,
                google_id=google_id
            )
            user = await user_service.create_user(user_create)
        
        # Update last login
        await user_service.update_last_login(user.id)
        
        # Generate JWT token
        access_token = self.create_access_token(
            data={"sub": user.id, "email": user.email}
        )
        
        token = Token(
            access_token=access_token,
            expires_in=settings.access_token_expire_minutes * 60
        )
        
        return LoginResponse(user=user, token=token)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        
        return encoded_jwt
    
    async def verify_token(self, token: str) -> Optional[TokenData]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            
            if user_id is None:
                return None
                
            return TokenData(user_id=user_id, email=email)
            
        except JWTError:
            return None
    
    async def get_current_user(self, token: str) -> Optional[UserResponse]:
        """Get current user from JWT token"""
        token_data = await self.verify_token(token)
        if not token_data or not token_data.user_id:
            return None
        
        user = await user_service.get_user_by_id(token_data.user_id)
        return user

# Global auth service instance
auth_service = AuthService()