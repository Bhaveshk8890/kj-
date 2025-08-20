from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ChatMode(str, Enum):
    RESEARCH = "research"
    CODE = "code"
    TROUBLESHOOT = "troubleshoot"
    STANDARD = "standard"

class MessageType(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"

class ChatMessageRequest(BaseModel):
    content: str
    mode: ChatMode
    session_id: Optional[str] = None
    
    # Troubleshoot mode specific fields
    code: Optional[str] = None
    error: Optional[str] = None
    comments: Optional[str] = None

class Source(BaseModel):
    title: str
    url: str
    type: str

class Step(BaseModel):
    step: int
    title: str
    description: str
    timestamp: str
    status: str = "completed"

class CodeBlock(BaseModel):
    language: str
    content: str

class LogEntry(BaseModel):
    level: str
    message: str
    timestamp: str

class Diagnostics(BaseModel):
    system: str
    version: str
    dependencies: List[Dict[str, Any]]
    environment: Dict[str, str]

class ModeSuggestion(BaseModel):
    suggested_mode: ChatMode
    confidence: float
    reason: str
    message: str

class ChatMessageResponse(BaseModel):
    id: str
    type: MessageType
    content: str
    timestamp: datetime
    sources: Optional[List[Source]] = None
    steps: Optional[List[Step]] = None
    code: Optional[CodeBlock] = None
    logs: Optional[List[LogEntry]] = None
    diagnostics: Optional[Diagnostics] = None
    mode: ChatMode
    processing_time: Optional[float] = None
    mode_suggestion: Optional[ModeSuggestion] = None

class ChatSession(BaseModel):
    id: str
    title: str
    mode: ChatMode
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    user_id: Optional[str] = None

class ChatSessionResponse(BaseModel):
    sessions: List[ChatSession]