from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class GoogleTokenRequest(BaseModel):
    token: str  # Google OAuth token

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None
    google_id: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

class LoginResponse(BaseModel):
    user: UserResponse
    token: Token