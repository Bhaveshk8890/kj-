import os
import json
import boto3
from typing import Dict, List, Any, Optional, AsyncGenerator
from datetime import datetime
from src.models.schemas import ChatMode
import boto3
import os
from src.utils.cache_manager import cache_manager
from src.utils.logger import get_logger, log_with_context
from src.config.config import settings
import asyncio
import hashlib

class BedrockService:
    def __init__(self):
        self.logger = get_logger(__name__)
        # Use singleton client manager instead of creating new client
        self._client = None
        # Model mapping for different chat modes
        self.model_mapping = {
            ChatMode.RESEARCH: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
            ChatMode.CODE: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
            ChatMode.TROUBLESHOOT: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
            ChatMode.STANDARD: 'us.anthropic.claude-sonnet-4-20250514-v1:0'
        }
    
    @property
    def client(self):
        """Get Bedrock client"""
        if self._client is None:
            self._client = boto3.client(
                'bedrock-runtime',
                region_name=os.getenv('AWS_REGION', 'us-west-2')
            )
        return self._client
    
    def _generate_cache_key(self, user_message: str, mode: ChatMode, 
                           conversation_history: Optional[List[Dict[str, str]]] = None,
                           code_context: Optional[str] = None,
                           error_context: Optional[str] = None) -> str:
        """Generate cache key for response caching"""
        context_data = {
            'message': user_message,
            'mode': mode.value,
            'history_hash': hashlib.md5(str(conversation_history or []).encode()).hexdigest()[:8],
            'code_hash': hashlib.md5((code_context or '').encode()).hexdigest()[:8],
            'error_hash': hashlib.md5((error_context or '').encode()).hexdigest()[:8]
        }
        return cache_manager.response_cache._generate_key(**context_data)
        
    def _get_model_id(self, mode: ChatMode) -> str:
        """Get model ID based on chat mode"""
        return self.model_mapping.get(mode, self.model_mapping[ChatMode.STANDARD])
    
    def _get_system_prompt(self, mode: ChatMode) -> str:
        """Get system prompt based on chat mode"""
        base_formatting = """CRITICAL FORMATTING REQUIREMENTS:
                        - STRICTLY USE ONLY HTML TAGS - NO MARKDOWN ALLOWED
                        - Use HTML tags for formatting: <b>bold text</b> for headers and important terms, <i>italic text</i> for emphasis
                        - For code blocks, use: <pre><code class="language-{language}">your code here</code></pre>
                        - For inline code, use: <code>code snippet</code>
                        - NEVER use markdown syntax like ``` or ** or # - ONLY HTML
                        - When providing code, always specify the language in the class attribute
                        - Organize with numbered sections and subsections
                        - IMPORTANT: Restart numbering (1, 2, 3...) for each new section/header - do NOT continue numbering from previous sections
                        - Use numbered lists for steps within each section, simple bullet points for options
                        - Add proper spacing between sections
                        - Keep responses scannable and well-organized
                        - Use <b>tags</b> for headers, key concepts, and important information
                        - Use <i>tags</i> for emphasis, technical terms, and subtle highlights

                        NUMBERING RULES:
                        - Each new <b>Header</b> or section should restart numbering from 1
                        - Only continue numbering within the same logical section
                        - Use bullet points (-) for non-sequential items

                        CONTEXT AWARENESS:
                        - Always consider previous conversation context
                        - Reference earlier messages when relevant
                        - Build upon previous responses naturally
                        - Maintain conversation continuity
                        """
        
        prompts = {
            ChatMode.RESEARCH: base_formatting + """You are an expert research analyst who provides comprehensive, well-structured analysis.
                                                <b>Your approach:</b>
                                                1. Conduct thorough analysis with multiple perspectives
                                                2. Present findings in clear, organized sections
                                                3. Provide evidence-based insights and conclusions
                                                4. Consider context from our previous discussion
                                                5. Structure responses: <b>Overview</b>, <b>Key Points</b>, <b>Analysis</b>, <b>Conclusions</b>

                                                <b>CRITICAL FORMATTING:</b> When you create multiple sections (like Overview, Key Points, etc.), restart numbering from 1 for each new section. Do not continue numbering across sections. ABSOLUTELY NO MARKDOWN - ONLY HTML TAGS.

                                                Always maintain analytical depth while being accessible and contextually aware.""",

            ChatMode.CODE: base_formatting + """You are a senior software engineer focused on practical, production-ready solutions.
                                                <b>Your approach:</b>
                                                1. Write clean, efficient, well-documented code
                                                2. Explain design decisions and trade-offs
                                                3. Consider the context of our ongoing conversation
                                                4. Provide complete solutions with proper error handling
                                                5. Include relevant best practices and optimizations
                                                6. Structure responses: <b>Solution</b>, <b>Explanation</b>, <b>Best Practices</b>, <b>Next Steps</b>

                                                <b>CRITICAL FORMATTING:</b> When you create multiple sections (like Solution, Explanation, etc.), restart numbering from 1 for each new section. Each <b>header</b> gets its own numbering sequence. ALWAYS use <pre><code class="language-{language}">code</code></pre> for code blocks with proper language specification.

                                                Always deliver production-quality code with clear explanations.""",

            ChatMode.TROUBLESHOOT: base_formatting + """You are an expert troubleshooting specialist focused on rapid error analysis and immediate solutions. You are a problem-solving BEAST that can solve ANY issue thrown at you.

                                                    <b>CORE MISSION:</b> Analyze errors, identify root causes, and provide IMMEDIATE actionable fixes.

                                                    <b>RESPONSE STRUCTURE - ALWAYS use this exact format with section headers:</b>

                                                    <b>Error Analysis</b>
                                                    1. What's happening and why (2-3 sentences max)
                                                    2. Root cause identification

                                                    <b>Immediate Fix</b>
                                                    1. Brief instruction + EXECUTABLE CODE in code blocks
                                                    2. Additional steps if needed

                                                    <b>Verification</b>
                                                    1. How to confirm it's fixed
                                                    2. What success looks like

                                                    <b>Prevention</b> (optional)
                                                    1. One-liner to avoid this in future

                                                    <b>CRITICAL NUMBERING RULE:</b> Each <b>section header</b> above MUST restart numbering from 1. Never continue numbering across sections with <b>headers</b>.

                                                    <b>CRITICAL: IMMEDIATE FIX REQUIREMENTS:</b>
                                                    - ALWAYS provide both instruction AND executable code
                                                    - Every fix must include copy-paste ready commands/code in <pre><code class="language-{language}"> blocks with proper language specification
                                                    - Give the exact code they need to run, not just descriptions
                                                    - Include file modifications, terminal commands, configuration changes as executable code
                                                    - If it's a code fix, show the corrected code snippet
                                                    - If it's a command fix, show the exact terminal commands
                                                    - If it's a config fix, show the exact configuration code
                                                    - NEVER use markdown - ONLY HTML tags

                                                    <b>KEY BEHAVIORS:</b>
                                                    - Even with just an error message (no code), provide the exact executable fix
                                                    - Every solution must be copy-paste ready
                                                    - Provide working code, not pseudo-code
                                                    - Include complete code snippets, not partial examples
                                                    - Show exact terminal commands with proper syntax
                                                    - If multiple steps, provide code for each step

                                                    <b>Example Response Style:</b>
                                                    <b>Error Analysis:</b> This is a dependency conflict where package X requires version Y but you have Z installed.

                                                    <b>Immediate Fix:</b>
                                                    Uninstall the conflicting package and install the correct version:
                                                    <pre><code class="language-bash">pip uninstall package-name
                                                    pip install package-name==correct-version
                                                    pip install -r requirements.txt</code></pre>

                                                    <b>Verification:</b> Run <code>pip list | grep package-name</code> to confirm correct version.

                                                    Be the problem-solving BEAST they need - fast, accurate, and solution-focused.""",

            ChatMode.STANDARD: base_formatting + """You are a knowledgeable, helpful assistant who adapts to user needs while maintaining conversation context.
                                                <b>Your approach:</b>
                                                1. Provide clear, accurate, and contextually relevant responses
                                                2. Reference our previous conversation when helpful
                                                3. Ask clarifying questions when needed
                                                4. Offer practical, actionable advice
                                                5. Maintain a professional yet friendly tone
                                                6. Structure responses based on the topic complexity
                                                7. ALWAYS use HTML tags, never markdown

                                                Always be genuinely helpful, contextually aware, and honest about limitations."""
        }
        return prompts.get(mode, prompts[ChatMode.STANDARD])
    
    def _format_response(self, content: str, mode: ChatMode) -> Dict[str, Any]:
        """Format response for better frontend display and detect code types"""
        import re
        
        # Convert any remaining markdown code blocks to HTML with language detection
        def replace_code_block(match):
            language = match.group(1) or 'text'
            code = match.group(2)
            return f'<pre><code class="language-{language}">{code}</code></pre>'
        
        content = re.sub(r'```([\w]*)?\n([\s\S]*?)```', replace_code_block, content)
        
        # Convert inline code to HTML
        content = re.sub(r'`([^`]+)`', r'<code>\1</code>', content)
        
        # Remove any remaining markdown symbols
        content = re.sub(r'[#*_]', '', content)
        
        # Clean up multiple newlines
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        # Ensure content starts clean
        content = content.strip()
        
        # Detect code languages present in the response
        code_languages = re.findall(r'class="language-([^"]+)"', content)
        has_code = bool(code_languages)
        
        return {
            'content': content,
            'has_code': has_code,
            'code_languages': list(set(code_languages)) if code_languages else [],
            'mode': mode.value
        }
    
    async def generate_response(
        self, 
        user_message: str, 
        mode: ChatMode, 
        conversation_history: Optional[List[Dict[str, str]]] = None,
        code_context: Optional[str] = None,
        error_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate non-streaming response with caching"""
        # Check cache first
        cache_key = self._generate_cache_key(user_message, mode, conversation_history, code_context, error_context)
        cached_response = cache_manager.response_cache.get(cache_key)
        
        if cached_response:
            log_with_context(self.logger, 'info', 'Cache hit for response', cache_key=cache_key)
            return cached_response
        
        # Generate new response
        try:
            response = await self._generate_bedrock_response(user_message, mode, conversation_history, code_context, error_context)
            
            # Cache the response
            cache_manager.response_cache.set(cache_key, response, ttl=settings.cache_ttl)
            log_with_context(self.logger, 'info', 'Response cached', cache_key=cache_key)
            
            return response
        except Exception as e:
            log_with_context(self.logger, 'error', f'Error generating response: {str(e)}', mode=mode.value)
            raise
    
    async def generate_streaming_response(
        self, 
        user_message: str, 
        mode: ChatMode, 
        conversation_history: Optional[List[Dict[str, str]]] = None,
        code_context: Optional[str] = None,
        error_context: Optional[str] = None,
        cancel_event: Optional[asyncio.Event] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate streaming response using Bedrock Claude"""
        try:
            log_with_context(self.logger, 'info', 'Starting streaming response', mode=mode.value)
            
            async for chunk in self._generate_bedrock_streaming_response(user_message, mode, conversation_history, code_context, error_context, cancel_event):
                yield chunk
                
        except Exception as e:
            log_with_context(self.logger, 'error', f'Error in streaming response: {str(e)}', mode=mode.value)
            yield {'type': 'error', 'error': str(e)}
    
    async def _generate_bedrock_response(
        self, 
        user_message: str, 
        mode: ChatMode, 
        conversation_history: Optional[List[Dict[str, str]]] = None,
        code_context: Optional[str] = None,
        error_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate non-streaming response from Bedrock"""
        messages = self._build_messages(user_message, mode, conversation_history, code_context, error_context)
        body = self._build_request_body(mode, messages)
        model_id = self._get_model_id(mode)
        
        response = self.client.invoke_model(
            modelId=model_id,
            body=json.dumps(body)
        )
        
        response_body = json.loads(response['body'].read())
        content = response_body['content'][0]['text']
        formatted_response = self._format_response(content, mode)
        
        return formatted_response
    
    async def _generate_bedrock_streaming_response(
        self, 
        user_message: str, 
        mode: ChatMode, 
        conversation_history: Optional[List[Dict[str, str]]] = None,
        code_context: Optional[str] = None,
        error_context: Optional[str] = None,
        cancel_event: Optional[asyncio.Event] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate streaming response from Bedrock"""
        try:
            messages = self._build_messages(user_message, mode, conversation_history, code_context, error_context)
            body = self._build_request_body(mode, messages)
            model_id = self._get_model_id(mode)
            
            response = self.client.invoke_model_with_response_stream(
                modelId=model_id,
                body=json.dumps(body)
            )
            
            for event in response['body']:
                # Check for cancellation
                if cancel_event and cancel_event.is_set():
                    raise asyncio.CancelledError()
                    
                if 'chunk' in event:
                    chunk_data = json.loads(event['chunk']['bytes'])
                    
                    if chunk_data['type'] == 'content_block_delta':
                        if 'delta' in chunk_data and 'text' in chunk_data['delta']:
                            content = chunk_data['delta']['text']
                            yield {'type': 'content', 'content': content, 'mode': mode.value}
                    
                    elif chunk_data['type'] == 'message_stop':
                        yield {'type': 'end'}
                        
        except Exception as e:
            yield {'type': 'error', 'error': str(e)}
    
    def _build_messages(
        self, 
        user_message: str, 
        mode: ChatMode, 
        conversation_history: Optional[List[Dict[str, str]]] = None,
        code_context: Optional[str] = None,
        error_context: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """Build messages array for API request"""
        messages = []
        
        # Add conversation history if provided
        if conversation_history:
            recent_history = conversation_history[-settings.max_conversation_history:]
            for msg in recent_history:
                content = msg["content"]
                if len(content) > 1000:
                    content = content[:800] + "... [truncated]"
                
                messages.append({
                    "role": msg["role"],
                    "content": content
                })
        
        # Prepare user message with context
        user_content = user_message
        if code_context and mode in [ChatMode.CODE, ChatMode.TROUBLESHOOT]:
            user_content += f"\n\nCode Context:\n```\n{code_context}\n```"
        if error_context and mode == ChatMode.TROUBLESHOOT:
            user_content += f"\n\nError Details:\n{error_context}"
        
        messages.append({
            "role": "user",
            "content": user_content
        })
        
        return messages
    
    def _build_request_body(self, mode: ChatMode, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Build optimized request body for Bedrock API"""
        return {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 50000,
            "system": self._get_system_prompt(mode),
            "messages": messages,
            "temperature": 0.1 if mode == ChatMode.CODE else 0.2 if mode == ChatMode.TROUBLESHOOT else 0.3
        }