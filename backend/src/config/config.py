from pydantic_settings import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8001
    backend_domain: str = "http://localhost:8001"
    debug: bool = False
    
    # AWS Bedrock Configuration
    aws_region: str = "us-west-2"
    bedrock_model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    
    # Performance Configuration
    max_conversation_history: int = 15
    response_timeout: int = 30
    max_concurrent_requests: int = 100
    cache_ttl: int = 300
    
    # Rate Limiting
    rate_limit_requests: int = 60
    rate_limit_window: int = 60
    
    # CORS Configuration
    allowed_origins: List[str] = ["http://localhost:5174", "http://localhost:3000", "*"]
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Authentication
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Google OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: Optional[str] = None
    


    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()