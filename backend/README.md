# Shellkode AI Chatbot Backend

FastAPI backend for the AI chatbot application with multiple chat modes.

## Setup

1. **Create and activate virtual environment:**
   ```bash
   # Option 1: Use the setup script
   chmod +x setup.sh
   ./setup.sh
   
   # Option 2: Manual setup
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the server:**
   ```bash
   # Make sure virtual environment is activated
   source venv/bin/activate
   python main.py
   ```
   
   Or with uvicorn:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```

## API Endpoints

### Chat
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/sessions` - Get all sessions
- `GET /api/chat/sessions/{session_id}` - Get session messages
- `POST /api/chat/sessions` - Create new session
- `DELETE /api/chat/sessions/{session_id}` - Delete session

### Health
- `GET /` - Root endpoint
- `GET /health` - Health check

## API Documentation

Once running, visit:
- Swagger UI: http://chat.shellkode.ai:8001/docs
- ReDoc: http://chat.shellkode.ai:8001/redoc

## Chat Modes

1. **Research Mode**: Deep research with sources and citations
2. **Code Mode**: Code generation and optimization
3. **Troubleshoot Mode**: Debug code with error analysis
4. **Standard Mode**: General AI assistance

## Future Integrations

- AWS Bedrock Claude models
- Internet search capabilities
- Database persistence
- User authentication