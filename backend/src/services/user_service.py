import uuid
from datetime import datetime
from typing import Dict, Optional
from src.models.auth_schemas import UserCreate, UserResponse
from src.utils.logger import get_logger

logger = get_logger(__name__)

class UserService:
    """In-memory user service - replace with database later"""
    
    def __init__(self):
        self.users: Dict[str, dict] = {}
        self.users_by_email: Dict[str, str] = {}
        self.users_by_google_id: Dict[str, str] = {}
    
    async def create_user(self, user_data: UserCreate) -> UserResponse:
        """Create a new user"""
        user_id = str(uuid.uuid4())
        
        user = {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "picture": user_data.picture,
            "google_id": user_data.google_id,
            "is_active": True,
            "created_at": datetime.now(),
            "last_login": None
        }
        
        self.users[user_id] = user
        self.users_by_email[user_data.email] = user_id
        self.users_by_google_id[user_data.google_id] = user_id
        
        logger.info(f"Created new user: {user_data.email}")
        
        return UserResponse(**user)
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID"""
        user = self.users.get(user_id)
        return UserResponse(**user) if user else None
    
    async def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        """Get user by email"""
        user_id = self.users_by_email.get(email)
        if user_id:
            user = self.users.get(user_id)
            return UserResponse(**user) if user else None
        return None
    
    async def get_user_by_google_id(self, google_id: str) -> Optional[UserResponse]:
        """Get user by Google ID"""
        user_id = self.users_by_google_id.get(google_id)
        if user_id:
            user = self.users.get(user_id)
            return UserResponse(**user) if user else None
        return None
    
    async def update_last_login(self, user_id: str):
        """Update user's last login time"""
        if user_id in self.users:
            self.users[user_id]["last_login"] = datetime.now()
            logger.info(f"Updated last login for user: {user_id}")

# Global user service instance
user_service = UserService()