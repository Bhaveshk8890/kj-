from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from src.services.auth_service import auth_service
from src.models.auth_schemas import UserResponse

security = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[UserResponse]:
    """Get current user from token (optional - returns None if no token)"""
    if not credentials:
        return None
    
    user = await auth_service.get_current_user(credentials.credentials)
    return user

async def get_current_user_required(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserResponse:
    """Get current user from token (required - raises exception if no valid token)"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await auth_service.get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user