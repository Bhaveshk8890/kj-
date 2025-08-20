import hashlib
import json
import time
from typing import Any, Optional, Dict
import threading

class InMemoryCache:
    """Thread-safe in-memory cache with TTL support"""
    
    def __init__(self, default_ttl: int = 300):  # 5 minutes default
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()
        self.default_ttl = default_ttl
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        key_data = json.dumps([args, sorted(kwargs.items())], sort_keys=True)
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        with self._lock:
            if key in self._cache:
                entry = self._cache[key]
                if time.time() < entry['expires_at']:
                    return entry['value']
                else:
                    del self._cache[key]
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with TTL"""
        ttl = ttl or self.default_ttl
        with self._lock:
            self._cache[key] = {
                'value': value,
                'expires_at': time.time() + ttl,
                'created_at': time.time()
            }
    
    def delete(self, key: str) -> None:
        """Delete key from cache"""
        with self._lock:
            self._cache.pop(key, None)
    
    def clear(self) -> None:
        """Clear all cache entries"""
        with self._lock:
            self._cache.clear()
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count"""
        current_time = time.time()
        expired_keys = []
        
        with self._lock:
            for key, entry in self._cache.items():
                if current_time >= entry['expires_at']:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self._cache[key]
        
        return len(expired_keys)

class CacheManager:
    """Cache manager for different cache types"""
    
    def __init__(self):
        self.response_cache = InMemoryCache(default_ttl=300)  # 5 min for responses
        self.conversation_cache = InMemoryCache(default_ttl=1800)  # 30 min for conversations
        self.mode_detection_cache = InMemoryCache(default_ttl=600)  # 10 min for mode detection
    
    def get_response_cache_key(self, message: str, mode: str, context_hash: str = "") -> str:
        """Generate cache key for responses"""
        return self.response_cache._generate_key(message, mode, context_hash)
    
    def get_conversation_cache_key(self, session_id: str) -> str:
        """Generate cache key for conversation summaries"""
        return f"conv_summary_{session_id}"
    
    def get_mode_detection_cache_key(self, message: str) -> str:
        """Generate cache key for mode detection"""
        return self.mode_detection_cache._generate_key(message)

# Global cache manager
cache_manager = CacheManager()