import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from src.models.schemas import (
    ChatMessageRequest, ChatMessageResponse, ChatMode, MessageType,
    Source, Step, CodeBlock, LogEntry, Diagnostics, ModeSuggestion
)
from src.services.bedrock_service import BedrockService
from src.services.mode_detector import ModeDetector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ChatService:
    def __init__(self):
        # In-memory storage for now (will be replaced with database)
        self.sessions: Dict[str, List[ChatMessageResponse]] = {}
        self.user_sessions: Dict[str, Dict[str, List[ChatMessageResponse]]] = {}  # user_id -> session_id -> messages
        self.bedrock_service = BedrockService()
        self.mode_detector = ModeDetector()
        self.conversation_history: Dict[str, List[Dict[str, str]]] = {}
    
    async def process_message(self, request: ChatMessageRequest, user_id: Optional[str] = None) -> ChatMessageResponse:
        start_time = time.time()
        
        # Generate message ID
        message_id = str(uuid.uuid4())
        
        # Check if mode switch should be suggested
        should_suggest, suggested_mode, suggestion_message = self.mode_detector.should_suggest_mode_switch(
            request.content, request.mode
        )
        
        mode_suggestion = None
        if should_suggest and suggested_mode:
            # Get confidence and reason for the suggestion
            _, confidence, reason = self.mode_detector.detect_mode(request.content, request.mode)
            mode_suggestion = ModeSuggestion(
                suggested_mode=suggested_mode,
                confidence=confidence,
                reason=reason,
                message=suggestion_message
            )
        
        # Process based on mode
        if request.mode == ChatMode.RESEARCH:
            response = await self._process_research_mode(request, message_id)
        elif request.mode == ChatMode.CODE:
            response = await self._process_code_mode(request, message_id)
        elif request.mode == ChatMode.TROUBLESHOOT:
            response = await self._process_troubleshoot_mode(request, message_id)
        else:
            response = await self._process_standard_mode(request, message_id)
        
        # Add mode suggestion to response
        response.mode_suggestion = mode_suggestion
        
        # Calculate processing time
        processing_time = time.time() - start_time
        response.processing_time = processing_time
        
        # Store in session and conversation history (if session_id provided)
        if request.session_id:
            if user_id:
                # Store in user-specific sessions
                if user_id not in self.user_sessions:
                    self.user_sessions[user_id] = {}
                if request.session_id not in self.user_sessions[user_id]:
                    self.user_sessions[user_id][request.session_id] = []
                    self.conversation_history[request.session_id] = []
                
                # Add to conversation history for context
                self.conversation_history[request.session_id].extend([
                    {"role": "user", "content": request.content},
                    {"role": "assistant", "content": response.content}
                ])
                
                self.user_sessions[user_id][request.session_id].append(response)
            else:
                # Fallback to global sessions for anonymous users
                if request.session_id not in self.sessions:
                    self.sessions[request.session_id] = []
                    self.conversation_history[request.session_id] = []
                
                self.conversation_history[request.session_id].extend([
                    {"role": "user", "content": request.content},
                    {"role": "assistant", "content": response.content}
                ])
                
                self.sessions[request.session_id].append(response)
        
        return response
    
    async def _process_research_mode(self, request: ChatMessageRequest, message_id: str) -> ChatMessageResponse:
        # Get conversation history for context
        history = self.conversation_history.get(request.session_id, []) if request.session_id else []
        
        # Generate response using Bedrock
        bedrock_response = await self.bedrock_service.generate_response(
            user_message=request.content,
            mode=request.mode,
            conversation_history=history
        )
        
        steps = [
            Step(step=1, title="Analysis", description="Analyzing research query", timestamp=datetime.now().strftime("%H:%M:%S")),
            Step(step=2, title="Research", description="Conducting deep research", timestamp=datetime.now().strftime("%H:%M:%S")),
            Step(step=3, title="Synthesis", description="Synthesizing comprehensive response", timestamp=datetime.now().strftime("%H:%M:%S"))
        ]
        
        return ChatMessageResponse(
            id=message_id,
            type=MessageType.ASSISTANT,
            content=self._format_html_response(bedrock_response['content'], request.mode),
            timestamp=datetime.now(),
            steps=steps,
            mode=request.mode
        )
    
    async def _process_code_mode(self, request: ChatMessageRequest, message_id: str) -> ChatMessageResponse:
        # Get conversation history for context
        history = self.conversation_history.get(request.session_id, []) if request.session_id else []
        
        # Generate response using Bedrock with code context
        bedrock_response = await self.bedrock_service.generate_response(
            user_message=request.content,
            mode=request.mode,
            conversation_history=history,
            code_context=request.code
        )
        
        steps = [
            Step(step=1, title="Requirements Analysis", description="Analyzing code requirements", timestamp=datetime.now().strftime("%H:%M:%S")),
            Step(step=2, title="Code Generation", description="Generating optimized solution", timestamp=datetime.now().strftime("%H:%M:%S")),
            Step(step=3, title="Validation", description="Validating against best practices", timestamp=datetime.now().strftime("%H:%M:%S"))
        ]
        
        # Extract code blocks from response if present
        code_block = None
        content = bedrock_response['content']
        if '```' in content:
            # Simple code extraction - can be enhanced
            import re
            code_match = re.search(r'```(\w+)?\n([\s\S]*?)```', content)
            if code_match:
                language = code_match.group(1) or 'text'
                code_content = code_match.group(2)
                code_block = CodeBlock(language=language, content=code_content)
        
        return ChatMessageResponse(
            id=message_id,
            type=MessageType.ASSISTANT,
            content=self._format_html_response(content, request.mode),
            timestamp=datetime.now(),
            code=code_block,
            steps=steps,
            mode=request.mode
        )
    
    async def _process_troubleshoot_mode(self, request: ChatMessageRequest, message_id: str) -> ChatMessageResponse:
        # Get conversation history for context
        history = self.conversation_history.get(request.session_id, []) if request.session_id else []
        
        # Generate response using Bedrock with code and error context
        bedrock_response = await self.bedrock_service.generate_response(
            user_message=request.content,
            mode=request.mode,
            conversation_history=history,
            code_context=request.code,
            error_context=request.error
        )
        
        steps = [
            Step(step=1, title="Code Analysis", description="Analyzing code structure and logic", timestamp=datetime.now().strftime("%H:%M:%S")),
            Step(step=2, title="Error Investigation", description="Investigating error patterns and causes", timestamp=datetime.now().strftime("%H:%M:%S")),
            Step(step=3, title="Solution Development", description="Developing comprehensive solution", timestamp=datetime.now().strftime("%H:%M:%S"))
        ]
        
        # Extract code blocks from response if present
        code_block = None
        content = bedrock_response['content']
        if '```' in content:
            import re
            code_match = re.search(r'```(\w+)?\n([\s\S]*?)```', content)
            if code_match:
                language = code_match.group(1) or 'text'
                code_content = code_match.group(2)
                code_block = CodeBlock(language=language, content=code_content)
        
        # Generate logs based on the troubleshooting process
        logs = [
            LogEntry(level="info", message="Starting diagnostic analysis", timestamp=datetime.now().strftime("%H:%M:%S")),
            LogEntry(level="info", message="Analysis complete", timestamp=datetime.now().strftime("%H:%M:%S"))
        ]
        
        if request.error:
            logs.insert(1, LogEntry(level="error", message=request.error, timestamp=datetime.now().strftime("%H:%M:%S")))
        
        return ChatMessageResponse(
            id=message_id,
            type=MessageType.ASSISTANT,
            content=self._format_html_response(content, request.mode),
            timestamp=datetime.now(),
            code=code_block,
            logs=logs,
            steps=steps,
            mode=request.mode
        )
    
    async def _process_standard_mode(self, request: ChatMessageRequest, message_id: str) -> ChatMessageResponse:
        # Get conversation history for context
        history = self.conversation_history.get(request.session_id, []) if request.session_id else []
        
        # Generate response using Bedrock
        bedrock_response = await self.bedrock_service.generate_response(
            user_message=request.content,
            mode=request.mode,
            conversation_history=history
        )
        
        return ChatMessageResponse(
            id=message_id,
            type=MessageType.ASSISTANT,
            content=self._format_html_response(bedrock_response['content'], request.mode),
            timestamp=datetime.now(),
            mode=request.mode
        )
    
    def get_session_messages(self, session_id: str, user_id: Optional[str] = None) -> List[ChatMessageResponse]:
        if user_id:
            return self.user_sessions.get(user_id, {}).get(session_id, [])
        return self.sessions.get(session_id, [])
    
    def get_all_sessions(self, user_id: Optional[str] = None) -> Dict[str, List[ChatMessageResponse]]:
        if user_id:
            return self.user_sessions.get(user_id, {})
        return self.sessions
    
    def get_user_sessions(self, user_id: str) -> Dict[str, List[ChatMessageResponse]]:
        return self.user_sessions.get(user_id, {})
    
    def create_user_session(self, user_id: str, session_id: str):
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = {}
        self.user_sessions[user_id][session_id] = []
        self.conversation_history[session_id] = []
    
    def delete_user_session(self, user_id: str, session_id: str) -> bool:
        if user_id in self.user_sessions and session_id in self.user_sessions[user_id]:
            del self.user_sessions[user_id][session_id]
            if session_id in self.conversation_history:
                del self.conversation_history[session_id]
            return True
        return False
    
    async def store_conversation_async(self, session_id: str, message_id: str, 
                                     user_content: str, assistant_content: str, mode: ChatMode, user_id: Optional[str] = None):
        """Store conversation asynchronously to avoid blocking streaming"""
        try:
            if user_id:
                # Store in user-specific sessions
                if user_id not in self.user_sessions:
                    self.user_sessions[user_id] = {}
                if session_id not in self.user_sessions[user_id]:
                    self.user_sessions[user_id][session_id] = []
                    self.conversation_history[session_id] = []
                
                # Add to conversation history
                self.conversation_history[session_id].extend([
                    {"role": "user", "content": user_content},
                    {"role": "assistant", "content": assistant_content}
                ])
                
                # Create response object for storage
                response = ChatMessageResponse(
                    id=message_id,
                    type="assistant",
                    content=assistant_content,
                    timestamp=datetime.now(),
                    mode=mode
                )
                self.user_sessions[user_id][session_id].append(response)
            else:
                # Fallback for anonymous users
                if session_id not in self.sessions:
                    self.sessions[session_id] = []
                    self.conversation_history[session_id] = []
                
                self.conversation_history[session_id].extend([
                    {"role": "user", "content": user_content},
                    {"role": "assistant", "content": assistant_content}
                ])
                
                response = ChatMessageResponse(
                    id=message_id,
                    type="assistant",
                    content=assistant_content,
                    timestamp=datetime.now(),
                    mode=mode
                )
                self.sessions[session_id].append(response)
            
        except Exception as e:
            # Log error but don't fail the streaming
            print(f"Error storing conversation: {e}")
    
    def _format_html_response(self, content: str, mode: ChatMode) -> str:
        """Format response content with HTML tags for better frontend rendering"""
        import re
        
        # Convert markdown-style formatting to HTML
        # Headers
        content = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', content, flags=re.MULTILINE)
        content = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', content, flags=re.MULTILINE)
        content = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', content, flags=re.MULTILINE)
        
        # Bold and italic
        content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', content)
        content = re.sub(r'\*(.*?)\*', r'<em>\1</em>', content)
        
        # Code blocks
        content = re.sub(r'```([\w]*)?\n([\s\S]*?)```', r'<pre><code class="language-\1">\2</code></pre>', content)
        content = re.sub(r'`([^`]+)`', r'<code>\1</code>', content)
        
        # Lists
        content = re.sub(r'^- (.*?)$', r'<li>\1</li>', content, flags=re.MULTILINE)
        content = re.sub(r'^\d+\. (.*?)$', r'<li>\1</li>', content, flags=re.MULTILINE)
        
        # Wrap consecutive list items in ul/ol tags
        content = re.sub(r'(<li>.*?</li>\n?)+', lambda m: f'<ul>{m.group(0)}</ul>', content)
        
        # Line breaks
        content = re.sub(r'\n\n', '<br><br>', content)
        content = re.sub(r'\n', '<br>', content)
        
        # Mode-specific formatting
        if mode == ChatMode.RESEARCH:
            content = f'<div class="research-response">{content}</div>'
        elif mode == ChatMode.CODE:
            content = f'<div class="code-response">{content}</div>'
        elif mode == ChatMode.TROUBLESHOOT:
            content = f'<div class="troubleshoot-response">{content}</div>'
        else:
            content = f'<div class="standard-response">{content}</div>'
        
        return content