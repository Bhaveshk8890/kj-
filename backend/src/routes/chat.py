from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from typing import Dict, List
from src.models.schemas import (
    ChatMessageRequest, ChatMessageResponse, ChatSession, ChatSessionResponse, ChatMode
)
from src.services.chat_service import ChatService
from src.utils.logger import get_logger, log_with_context, get_correlation_id
from src.config.config import settings
from src.middleware.auth_middleware import get_current_user_optional
from src.models.auth_schemas import UserResponse
import uuid
import json
import asyncio
from datetime import datetime

router = APIRouter()
chat_service = ChatService()
logger = get_logger(__name__)

# Track active streaming cancellation events
active_streams: Dict[str, asyncio.Event] = {}

@router.post("/message", response_model=ChatMessageResponse)
async def send_message(request: ChatMessageRequest,current_user: UserResponse = Depends(get_current_user_optional)):
    """
    Send a message to the AI chatbot (non-streaming)
    """
    try:
        log_with_context(logger, 'info', 'Processing message request', mode=request.mode.value, session_id=request.session_id,message_length=len(request.content))
        
        # Add timeout for long-running requests
        user_id = current_user.id if current_user else None
        response = await asyncio.wait_for(chat_service.process_message(request, user_id),timeout=settings.response_timeout)
        
        log_with_context(logger, 'info', 'Message processed successfully',response_length=len(response.content))
        return response
        
    except asyncio.TimeoutError:
        log_with_context(logger, 'error', 'Request timeout', timeout=settings.response_timeout)
        raise HTTPException(status_code=408, detail="Request timeout")
    except ValueError as e:
        log_with_context(logger, 'error', f'Validation error: {str(e)}')
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log_with_context(logger, 'error', f'Unexpected error: {str(e)}')
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/message/stream")
async def send_message_stream(request: ChatMessageRequest,current_user: UserResponse = Depends(get_current_user_optional)):
    """
    Send a message to the AI chatbot with streaming response
    """
    try:
        # Generate unique request ID for tracking
        request_id = str(uuid.uuid4())
        
        # Create cancellation event
        cancel_event = asyncio.Event()
        active_streams[request_id] = cancel_event
        
        async def generate_stream():
            # Get conversation history for context
            history = chat_service.conversation_history.get(request.session_id, []) if request.session_id else []
            
            # Check if mode switch should be suggested
            should_suggest, suggested_mode, suggestion_message = chat_service.mode_detector.should_suggest_mode_switch(request.content, request.mode)
            
            # Send mode suggestion first if applicable
            if should_suggest and suggested_mode:
                _, confidence, reason = chat_service.mode_detector.detect_mode(request.content, request.mode)
                mode_suggestion = {
                    "suggested_mode": suggested_mode.value,
                    "confidence": confidence,
                    "reason": reason,
                    "message": suggestion_message
                }
                
                yield f"data: {json.dumps({'type': 'mode_suggestion', 'data': mode_suggestion})}\n\n"
            
            # Generate message ID
            message_id = str(uuid.uuid4())
            
            # Send start event with request ID
            yield f"data: {json.dumps({'type': 'start', 'message_id': message_id, 'request_id': request_id, 'timestamp': datetime.now().isoformat()})}\n\n"
            
            # Stream the AI response with code block detection
            accumulated_content = ""
            buffer = ""
            
            try:
                async for chunk in chat_service.bedrock_service.generate_streaming_response(
                    user_message=request.content,
                    mode=request.mode,
                    conversation_history=history,
                    code_context=request.code,
                    error_context=request.error,
                    cancel_event=cancel_event
                ):
                    # Check for cancellation before processing each chunk
                    if cancel_event.is_set():
                        raise asyncio.CancelledError()
                        
                    if chunk['type'] == 'content':
                        content = chunk['content']
                        accumulated_content += content
                        buffer += content
                        
                        # Check for code block markers
                        if '```' in buffer:
                            parts = buffer.split('```')
                            
                            # Process complete parts
                            for i, part in enumerate(parts[:-1]):
                                if i % 2 == 0:  # Text before code block
                                    if part:
                                        yield f"data: {json.dumps({'type': 'content', 'content': part})}\n\n"
                                else:  # Code block content
                                    # Extract language and code
                                    lines = part.split('\n', 1)
                                    lang = lines[0].strip() if lines else ''
                                    code_content = lines[1] if len(lines) > 1 else ''
                                    
                                    # Send as structured code block
                                    code_block = {'type': 'code_block','language': lang,'content': code_content}
                                    yield f"data: {json.dumps(code_block)}\n\n"
                            
                            # Keep the last incomplete part in buffer
                            buffer = parts[-1]
                        else:
                            # No code blocks, send content normally but check for partial markers
                            if not buffer.endswith('`'):
                                # Send content that doesn't end with potential code marker
                                send_content = buffer
                                if '`' in send_content:
                                    # Keep potential code marker in buffer
                                    last_backtick = send_content.rfind('`')
                                    if last_backtick > 0:
                                        yield f"data: {json.dumps({'type': 'content', 'content': send_content[:last_backtick]})}\n\n"
                                        buffer = send_content[last_backtick:]
                                    else:
                                        buffer = send_content
                                else:
                                    yield f"data: {json.dumps({'type': 'content', 'content': send_content})}\n\n"
                                    buffer = ""
                    
                    elif chunk['type'] == 'end':
                        # Send any remaining buffer content
                        if buffer:
                            yield f"data: {json.dumps({'type': 'content', 'content': buffer})}\n\n"
                        
                        # Store session data asynchronously to avoid blocking
                        if request.session_id and accumulated_content:
                            user_id = current_user.id if current_user else None
                            asyncio.create_task(chat_service.store_conversation_async(
                                request.session_id, message_id, request.content, 
                                accumulated_content, request.mode, user_id
                            ))
                        
                        yield f"data: {json.dumps({'type': 'end', 'message_id': message_id})}\n\n"
                    
                    elif chunk['type'] == 'error':
                        yield f"data: {json.dumps({'type': 'error', 'error': chunk['error']})}\n\n"
            
            except asyncio.CancelledError:
                yield f"data: {json.dumps({'type': 'stopped', 'message': 'Response generation stopped'})}\n\n"
                return
            finally:
                # Clean up event from tracking
                active_streams.pop(request_id, None)
            
            # Send final done event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop/{request_id}")
async def stop_streaming(request_id: str):
    """
    Stop an active streaming response
    """
    try:
        if request_id in active_streams:
            cancel_event = active_streams[request_id]
            cancel_event.set()
            return {"message": "Streaming stopped successfully", "request_id": request_id}
        else:
            raise HTTPException(status_code=404, detail="Active streaming request not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions", response_model=ChatSessionResponse)
async def get_sessions(current_user: UserResponse = Depends(get_current_user_optional)):
    """
    Get all chat sessions for the current user
    """
    try:
        user_id = current_user.id if current_user else None
        sessions_data = chat_service.get_all_sessions(user_id)
        sessions = []
        
        for session_id, messages in sessions_data.items():
            if messages:
                first_message = messages[0]
                sessions.append(ChatSession(
                    id=session_id,
                    title=first_message.content[:50] + "..." if len(first_message.content) > 50 else first_message.content,
                    mode=first_message.mode,
                    created_at=first_message.timestamp,
                    updated_at=messages[-1].timestamp,
                    message_count=len(messages),
                    user_id=user_id
                ))
        
        return ChatSessionResponse(sessions=sessions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}", response_model=List[ChatMessageResponse])
async def get_session_messages(session_id: str, current_user: UserResponse = Depends(get_current_user_optional)):
    """
    Get messages for a specific session (user-specific)
    """
    try:
        user_id = current_user.id if current_user else None
        messages = chat_service.get_session_messages(session_id, user_id)
        if not messages:
            raise HTTPException(status_code=404, detail="Session not found")
        return messages
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions", response_model=Dict[str, str])
async def create_session(current_user: UserResponse = Depends(get_current_user_optional)):
    """
    Create a new chat session for the current user
    """
    try:
        session_id = str(uuid.uuid4())
        user_id = current_user.id if current_user else None
        
        if user_id:
            chat_service.create_user_session(user_id, session_id)
        
        return {"session_id": session_id, "message": "Session created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, current_user: UserResponse = Depends(get_current_user_optional)):
    """
    Delete a chat session for the current user
    """
    try:
        user_id = current_user.id if current_user else None
        
        if user_id:
            if chat_service.delete_user_session(user_id, session_id):
                return {"message": "Session deleted successfully"}
            else:
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            # Fallback for anonymous users
            if session_id in chat_service.sessions:
                del chat_service.sessions[session_id]
                return {"message": "Session deleted successfully"}
            else:
                raise HTTPException(status_code=404, detail="Session not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))