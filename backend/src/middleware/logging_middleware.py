from fastapi import Request
from src.utils.logger import get_logger, set_correlation_id
from src.utils.performance_monitor import performance_monitor
import time
import uuid

logger = get_logger(__name__)

async def logging_middleware(request: Request, call_next):
    """Request logging and performance monitoring middleware"""
    # Set correlation ID
    correlation_id = request.headers.get('X-Correlation-ID') or str(uuid.uuid4())
    set_correlation_id(correlation_id)
    
    # Track active connections
    performance_monitor.increment_connections()
    
    start_time = time.time()
    
    # Log request
    logger.info(f"Request started: {request.method} {request.url.path}", 
               extra={'extra_fields': {
                   'method': request.method,
                   'path': request.url.path,
                   'correlation_id': correlation_id
               }})
    
    try:
        response = await call_next(request)
        
        # Record performance metrics
        process_time = time.time() - start_time
        performance_monitor.record_response_time(process_time)
        
        # Log response
        logger.info(f"Request completed: {request.method} {request.url.path} - {response.status_code}",
                   extra={'extra_fields': {
                       'method': request.method,
                       'path': request.url.path,
                       'status_code': response.status_code,
                       'process_time': process_time,
                       'correlation_id': correlation_id
                   }})
        
        # Add headers
        response.headers['X-Correlation-ID'] = correlation_id
        response.headers['X-Process-Time'] = str(process_time)
        
        return response
        
    finally:
        # Always decrement connections
        performance_monitor.decrement_connections()