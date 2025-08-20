import logging
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from contextvars import ContextVar
from src.config.config import settings

# Context variable for correlation ID
correlation_id: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)

class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'correlation_id': correlation_id.get(),
        }
        
        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry)

def setup_logging():
    """Setup structured logging configuration"""
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format=settings.log_format,
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('app.log')
        ]
    )
    
    # Set structured formatter for file handler
    file_handler = logging.getLogger().handlers[1]
    file_handler.setFormatter(StructuredFormatter())

def get_logger(name: str) -> logging.Logger:
    """Get logger with structured formatting"""
    return logging.getLogger(name)

def log_with_context(logger: logging.Logger, level: str, message: str, **kwargs):
    """Log with additional context"""
    extra_fields = {
        'service': 'shellkode-chatbot',
        'version': '1.0.0',
        **kwargs
    }
    
    getattr(logger, level.lower())(message, extra={'extra_fields': extra_fields})

def set_correlation_id(corr_id: str = None) -> str:
    """Set correlation ID for request tracking"""
    if not corr_id:
        corr_id = str(uuid.uuid4())
    correlation_id.set(corr_id)
    return corr_id

def get_correlation_id() -> Optional[str]:
    """Get current correlation ID"""
    return correlation_id.get()

# Initialize logging
setup_logging()