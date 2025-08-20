import re
from typing import Dict, List, Optional, Tuple
from src.models.schemas import ChatMode
from src.utils.cache_manager import cache_manager
from src.utils.logger import get_logger, log_with_context

class ModeDetector:
    def __init__(self):
        self.logger = get_logger(__name__)
        # Keywords and patterns for different modes
        self.mode_patterns = {
            ChatMode.CODE: {
                'keywords': [
                    'code', 'function', 'class', 'method', 'variable', 'algorithm', 'programming',
                    'python', 'javascript', 'java', 'c++', 'react', 'node', 'api', 'database',
                    'sql', 'html', 'css', 'framework', 'library', 'import', 'export', 'syntax',
                    'compile', 'execute', 'run', 'build', 'deploy', 'git', 'repository', 'commit',
                    'write code', 'create function', 'implement', 'develop', 'build app', 'script'
                ],
                'patterns': [
                    r'\b(def|function|class|import|from|return|if|else|for|while|try|catch)\b',
                    r'\b(console\.log|print|echo|printf)\b',
                    r'\b(\.js|\.py|\.java|\.cpp|\.html|\.css|\.json|\.xml)\b',
                    r'[{}()\[\];]',
                    r'(write|create|build|generate|implement).*(code|function|class|app|script)',
                    r'(how to|help me).*(code|program|implement|build|create)',
                ]
            },
            ChatMode.TROUBLESHOOT: {
                'keywords': [
                    'error', 'bug', 'issue', 'problem', 'fix', 'debug', 'troubleshoot', 'broken',
                    'not working', 'failed', 'exception', 'crash', 'freeze', 'hang', 'slow',
                    'memory leak', 'performance', 'optimize', 'stack trace', 'traceback',
                    'undefined', 'null', 'reference error', 'syntax error', 'runtime error',
                    'compilation error', 'build error', 'deployment error', 'connection error'
                ],
                'patterns': [
                    r'\b(error|exception|failed|crash|bug|issue|problem|fix|debug)\b',
                    r'\b(not working|doesn\'t work|won\'t work|broken|failing)\b',
                    r'\b(stack trace|traceback|error message|exception thrown)\b',
                    r'(why is|what\'s wrong|help fix|solve|resolve).*(error|issue|problem)',
                    r'(getting|receiving|encountering).*(error|exception|issue)',
                ]
            },
            ChatMode.RESEARCH: {
                'keywords': [
                    'research', 'analyze', 'study', 'investigate', 'explore', 'compare',
                    'what is', 'how does', 'explain', 'definition', 'concept', 'theory',
                    'history', 'background', 'overview', 'summary', 'analysis', 'evaluation',
                    'pros and cons', 'advantages', 'disadvantages', 'benefits', 'drawbacks',
                    'trends', 'statistics', 'data', 'report', 'findings', 'conclusion'
                ],
                'patterns': [
                    r'\b(what is|what are|how does|how do|why is|why are|when is|when are)\b',
                    r'\b(explain|describe|analyze|compare|contrast|evaluate|assess)\b',
                    r'\b(research|study|investigate|explore|examine|review)\b',
                    r'(tell me about|give me information|I want to know|I need to understand)',
                    r'(pros and cons|advantages and disadvantages|benefits and drawbacks)',
                ]
            }
        }
        
        # Confidence thresholds
        self.confidence_threshold = 0.3
        self.high_confidence_threshold = 0.6
    
    def detect_mode(self, query: str, current_mode: ChatMode) -> Tuple[Optional[ChatMode], float, str]:
        """
        Detect the most appropriate mode for a query
        Returns: (suggested_mode, confidence, reason)
        """
        # Check cache first
        cache_key = cache_manager.get_mode_detection_cache_key(query)
        cached_result = cache_manager.mode_detection_cache.get(cache_key)
        
        if cached_result:
            log_with_context(self.logger, 'debug', 'Mode detection cache hit', query_length=len(query))
            return cached_result
        
        query_lower = query.lower()
        mode_scores = {}
        
        # Calculate scores for each mode
        for mode, patterns in self.mode_patterns.items():
            score = 0
            matched_keywords = []
            matched_patterns = []
            
            # Check keywords
            for keyword in patterns['keywords']:
                if keyword.lower() in query_lower:
                    score += 1
                    matched_keywords.append(keyword)
            
            # Check regex patterns
            for pattern in patterns['patterns']:
                if re.search(pattern, query_lower, re.IGNORECASE):
                    score += 2  # Patterns have higher weight
                    matched_patterns.append(pattern)
            
            # Normalize score by query length
            normalized_score = score / max(len(query.split()), 1)
            mode_scores[mode] = {
                'score': normalized_score,
                'keywords': matched_keywords,
                'patterns': matched_patterns
            }
        
        # Find the best mode
        best_mode = max(mode_scores.keys(), key=lambda m: mode_scores[m]['score'])
        best_score = mode_scores[best_mode]['score']
        
        # Generate reason
        reason = self._generate_reason(best_mode, mode_scores[best_mode], query)
        
        # Only suggest if confidence is above threshold and different from current mode
        result = None, best_score, reason
        if best_score >= self.confidence_threshold and best_mode != current_mode:
            result = best_mode, best_score, reason
        
        # Cache the result
        cache_manager.mode_detection_cache.set(cache_key, result)
        log_with_context(self.logger, 'debug', 'Mode detection completed', 
                        suggested_mode=result[0].value if result[0] else None,
                        confidence=result[1])
        
        return result
    
    def _generate_reason(self, mode: ChatMode, score_data: Dict, query: str) -> str:
        """Generate a human-readable reason for the mode suggestion"""
        keywords = score_data['keywords'][:3]  # Top 3 keywords
        
        if mode == ChatMode.CODE:
            if keywords:
                return f"This query contains programming-related terms like '{', '.join(keywords)}' which are better suited for code mode."
            return "This appears to be a programming or development-related query."
        
        elif mode == ChatMode.TROUBLESHOOT:
            if keywords:
                return f"This query mentions issues like '{', '.join(keywords)}' which are perfect for troubleshoot mode."
            return "This seems to be about fixing or debugging a problem."
        
        elif mode == ChatMode.RESEARCH:
            if keywords:
                return f"This query uses research terms like '{', '.join(keywords)}' which work best in research mode."
            return "This appears to be a research or informational query."
        
        return "This query might be better suited for a different mode."
    
    def should_suggest_mode_switch(self, query: str, current_mode: ChatMode) -> Tuple[bool, Optional[ChatMode], str]:
        """
        Determine if we should suggest a mode switch
        Returns: (should_suggest, suggested_mode, message)
        """
        suggested_mode, confidence, reason = self.detect_mode(query, current_mode)
        
        if suggested_mode and confidence >= self.confidence_threshold:
            mode_names = {
                ChatMode.CODE: "Code",
                ChatMode.TROUBLESHOOT: "Troubleshoot", 
                ChatMode.RESEARCH: "Research",
                ChatMode.STANDARD: "Standard"
            }
            
            message = f"This seems to be a query which is best suited for {mode_names[suggested_mode]} mode. {reason} Do you want to switch to {mode_names[suggested_mode]} mode?"
            
            return True, suggested_mode, message
        
        return False, None, ""