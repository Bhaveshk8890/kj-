from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from src.routes.chat import router as chat_router
from src.routes.auth import router as auth_router
from src.config.config import settings
from src.middleware.rate_limiter import RateLimitMiddleware
from src.middleware.exception_handler import global_exception_handler
from src.middleware.logging_middleware import logging_middleware
from src.utils.logger import get_logger, get_correlation_id
from src.utils.background_tasks import background_task_manager

import time

logger = get_logger(__name__)

app = FastAPI(title="Shellkode AI Chatbot API",description="Backend API for AI chatbot with multiple modes",version="1.0.0")

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# CORS middleware
app.add_middleware(CORSMiddleware,allow_origins=settings.allowed_origins,allow_credentials=True,allow_methods=["*"],allow_headers=["*"],)

# Add logging middleware
app.middleware("http")(logging_middleware)

# Register global exception handler
app.add_exception_handler(Exception, global_exception_handler)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

@app.get("/")
async def root():
    return {
        "message": "Shellkode AI Chatbot API is running",
        "version": "1.0.0",
        "correlation_id": get_correlation_id()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "correlation_id": get_correlation_id()
    }



# Application lifecycle events
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting Shellkode AI Chatbot API")
    background_task_manager.start_background_tasks()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("Shutting down Shellkode AI Chatbot API")
    background_task_manager.stop_background_tasks()
    


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001 , log_level="debug")