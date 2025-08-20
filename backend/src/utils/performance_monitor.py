import time
import psutil
import threading
from typing import Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class PerformanceMetrics:
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    active_connections: int
    response_times: list
    cache_hit_rate: float
    timestamp: datetime

class PerformanceMonitor:
    """Monitor application performance metrics"""
    
    def __init__(self):
        self.response_times = []
        self.cache_hits = 0
        self.cache_misses = 0
        self.active_connections = 0
        self.lock = threading.RLock()
        self.start_time = time.time()
    
    def record_response_time(self, response_time: float):
        """Record API response time"""
        with self.lock:
            self.response_times.append(response_time)
            # Keep only last 1000 response times
            if len(self.response_times) > 1000:
                self.response_times = self.response_times[-1000:]
    
    def record_cache_hit(self):
        """Record cache hit"""
        with self.lock:
            self.cache_hits += 1
    
    def record_cache_miss(self):
        """Record cache miss"""
        with self.lock:
            self.cache_misses += 1
    
    def increment_connections(self):
        """Increment active connections"""
        with self.lock:
            self.active_connections += 1
    
    def decrement_connections(self):
        """Decrement active connections"""
        with self.lock:
            self.active_connections = max(0, self.active_connections - 1)
    
    def get_metrics(self) -> PerformanceMetrics:
        """Get current performance metrics"""
        with self.lock:
            # System metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used_mb = memory.used / (1024 * 1024)
            
            # Cache hit rate
            total_cache_requests = self.cache_hits + self.cache_misses
            cache_hit_rate = (self.cache_hits / total_cache_requests * 100) if total_cache_requests > 0 else 0
            
            return PerformanceMetrics(
                cpu_percent=cpu_percent,
                memory_percent=memory_percent,
                memory_used_mb=memory_used_mb,
                active_connections=self.active_connections,
                response_times=self.response_times.copy(),
                cache_hit_rate=cache_hit_rate,
                timestamp=datetime.now()
            )
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """Get summary performance statistics"""
        metrics = self.get_metrics()
        
        response_times = metrics.response_times
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        max_response_time = max(response_times) if response_times else 0
        min_response_time = min(response_times) if response_times else 0
        
        # Calculate percentiles
        if response_times:
            sorted_times = sorted(response_times)
            p95_index = int(0.95 * len(sorted_times))
            p99_index = int(0.99 * len(sorted_times))
            p95_response_time = sorted_times[p95_index] if p95_index < len(sorted_times) else max_response_time
            p99_response_time = sorted_times[p99_index] if p99_index < len(sorted_times) else max_response_time
        else:
            p95_response_time = p99_response_time = 0
        
        uptime_seconds = time.time() - self.start_time
        
        return {
            "system": {
                "cpu_percent": metrics.cpu_percent,
                "memory_percent": metrics.memory_percent,
                "memory_used_mb": round(metrics.memory_used_mb, 2),
                "uptime_seconds": round(uptime_seconds, 2)
            },
            "application": {
                "active_connections": metrics.active_connections,
                "cache_hit_rate": round(metrics.cache_hit_rate, 2),
                "total_cache_hits": self.cache_hits,
                "total_cache_misses": self.cache_misses
            },
            "response_times": {
                "average_ms": round(avg_response_time * 1000, 2),
                "min_ms": round(min_response_time * 1000, 2),
                "max_ms": round(max_response_time * 1000, 2),
                "p95_ms": round(p95_response_time * 1000, 2),
                "p99_ms": round(p99_response_time * 1000, 2),
                "total_requests": len(response_times)
            },
            "timestamp": metrics.timestamp.isoformat()
        }

# Global performance monitor
performance_monitor = PerformanceMonitor()