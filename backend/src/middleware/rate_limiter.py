import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from src.config.config import settings
import threading

class RateLimiter:
    """Thread-safe rate limiter using sliding window"""
    
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}
        self.lock = threading.RLock()
    
    def is_allowed(self, client_id: str) -> Tuple[bool, Dict[str, int]]:
        """Check if request is allowed and return rate limit info"""
        current_time = time.time()
        
        with self.lock:
            if client_id not in self.requests:
                self.requests[client_id] = []
            
            # Remove old requests outside the window
            self.requests[client_id] = [
                req_time for req_time in self.requests[client_id]
                if current_time - req_time < self.window_seconds
            ]
            
            # Check if under limit
            if len(self.requests[client_id]) < self.max_requests:
                self.requests[client_id].append(current_time)
                remaining = self.max_requests - len(self.requests[client_id])
                reset_time = int(current_time + self.window_seconds)
                
                return True, {
                    'limit': self.max_requests,
                    'remaining': remaining,
                    'reset': reset_time
                }
            else:
                # Calculate when the oldest request will expire
                oldest_request = min(self.requests[client_id])
                reset_time = int(oldest_request + self.window_seconds)
                
                return False, {
                    'limit': self.max_requests,
                    'remaining': 0,
                    'reset': reset_time
                }

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""
    
    def __init__(self, app, max_requests: int = None, window_seconds: int = None):
        super().__init__(app)
        self.rate_limiter = RateLimiter(
            max_requests or settings.rate_limit_requests,
            window_seconds or settings.rate_limit_window
        )
    
    def get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Use X-Forwarded-For if behind proxy, otherwise use client IP
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        return request.client.host if request.client else 'unknown'
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ['/health', '/']:
            return await call_next(request)
        
        client_id = self.get_client_id(request)
        allowed, rate_info = self.rate_limiter.is_allowed(client_id)
        
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded",
                headers={
                    'X-RateLimit-Limit': str(rate_info['limit']),
                    'X-RateLimit-Remaining': str(rate_info['remaining']),
                    'X-RateLimit-Reset': str(rate_info['reset']),
                    'Retry-After': str(rate_info['reset'] - int(time.time()))
                }
            )
        
        response = await call_next(request)
        
        # Add rate limit headers to response
        response.headers['X-RateLimit-Limit'] = str(rate_info['limit'])
        response.headers['X-RateLimit-Remaining'] = str(rate_info['remaining'])
        response.headers['X-RateLimit-Reset'] = str(rate_info['reset'])
        
        return response