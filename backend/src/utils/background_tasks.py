import asyncio
import threading
from src.utils.cache_manager import cache_manager
from src.utils.logger import get_logger
from src.config.config import settings

logger = get_logger(__name__)

class BackgroundTaskManager:
    """Manager for background tasks"""
    
    def __init__(self):
        self.running = False
        self.tasks = []
    
    async def cache_cleanup_task(self):
        """Periodic cache cleanup task"""
        while self.running:
            try:
                # Cleanup expired cache entries
                response_expired = cache_manager.response_cache.cleanup_expired()
                conversation_expired = cache_manager.conversation_cache.cleanup_expired()
                mode_detection_expired = cache_manager.mode_detection_cache.cleanup_expired()
                
                total_expired = response_expired + conversation_expired + mode_detection_expired
                
                if total_expired > 0:
                    logger.info(f"Cache cleanup completed: {total_expired} expired entries removed")
                
                # Sleep for 5 minutes
                await asyncio.sleep(300)
                
            except Exception as e:
                logger.error(f"Error in cache cleanup task: {str(e)}")
                await asyncio.sleep(60)  # Retry after 1 minute on error
    
    def start_background_tasks(self):
        """Start all background tasks"""
        if not self.running:
            self.running = True
            
            # Start cache cleanup task
            cache_task = asyncio.create_task(self.cache_cleanup_task())
            self.tasks.append(cache_task)
            
            logger.info("Background tasks started")
    
    def stop_background_tasks(self):
        """Stop all background tasks"""
        self.running = False
        
        for task in self.tasks:
            if not task.done():
                task.cancel()
        
        self.tasks.clear()
        logger.info("Background tasks stopped")

# Global background task manager
background_task_manager = BackgroundTaskManager()