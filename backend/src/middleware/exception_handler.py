from fastapi import Request
from fastapi.responses import JSONResponse
from src.utils.logger import get_logger, get_correlation_id

logger = get_logger(__name__)

async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled exceptions"""
    correlation_id = get_correlation_id()
    logger.error(f"Unhandled exception: {str(exc)}",
                extra={'extra_fields': {
                    'exception_type': type(exc).__name__,
                    'correlation_id': correlation_id,
                    'path': request.url.path
                }}, exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "correlation_id": correlation_id
        }
    )