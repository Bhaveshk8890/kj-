from fastapi import APIRouter, HTTPException, Depends
from src.models.auth_schemas import GoogleTokenRequest, LoginResponse, UserResponse
from src.services.auth_service import auth_service
from src.middleware.auth_middleware import get_current_user_required
from src.utils.logger import get_logger, log_with_context

router = APIRouter()
logger = get_logger(__name__)


@router.post("/google", response_model=LoginResponse)
async def google_login(request: GoogleTokenRequest):
    """Login with Google OAuth token"""
    try:
        log_with_context(logger, 'info', 'Google login attempt')
        
        login_response = await auth_service.authenticate_with_google(request.token)
        
        if not login_response:
            raise HTTPException(
                status_code=401,
                detail="Invalid Google token"
            )
        
        log_with_context(logger, 'info', 'Google login successful', 
                        user_id=login_response.user.id)
        
        return login_response
        
    except HTTPException:
        raise
    except Exception as e:
        log_with_context(logger, 'error', f'Google login error: {str(e)}')
        raise HTTPException(
            status_code=500,
            detail="Authentication failed"
        )

