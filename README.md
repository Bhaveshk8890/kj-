# Shellkode AI Chatbot

<div align="center">
  <p>A full-stack AI chatbot application with React TypeScript frontend and Python FastAPI backend</p>
  <p>
    <img src="https://img.shields.io/badge/React-18.2.0-blue?logo=react" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-5.2.2-blue?logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi" alt="FastAPI">
    <img src="https://img.shields.io/badge/Python-3.8+-green?logo=python" alt="Python">
    <img src="https://img.shields.io/badge/AWS-Bedrock-orange?logo=amazon-aws" alt="AWS Bedrock">
  </p>
</div>

## 🚀 Features

- **🎯 Multiple Chat Modes**: Research, Troubleshoot, Code, Standard
- **🎤 Voice Recording**: Audio visualization and transcription
- **💾 Session Management**: Persistent chat history with IndexedDB
- **📊 Analytics Dashboard**: Usage insights and metrics with Recharts
- **🤖 AI Agents Management**: Configure and manage AI agents
- **🔐 Google SSO**: Secure authentication with Google OAuth
- **⚡ Real-time Streaming**: Live response streaming with WebSocket-like experience
- **☁️ AWS Bedrock Integration**: Powered by AWS AI services
- **🎨 Modern UI**: Responsive design with Tailwind CSS
- **🔄 Auto-sync**: Cross-tab session synchronization

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **AWS CLI** (configured with appropriate credentials)
- **Git**

## 🏗️ Project Structure

```
shellkode-ai-chatbot/
├── Frontend/                    # React TypeScript frontend
│   ├── components/             # Reusable React components
│   │   ├── ui/                # UI components
│   │   ├── figma/             # Figma-imported components
│   │   ├── ChatInterface.tsx   # Main chat interface
│   │   ├── StreamingMessage.tsx # Message streaming component
│   │   └── VoiceRecorder.tsx   # Voice recording functionality
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API services and utilities
│   │   ├── api.ts            # API client
│   │   ├── auth.ts           # Authentication service
│   │   └── indexedDB.ts      # Local storage service
│   ├── styles/               # Global styles
│   └── assets/               # Static assets
├── backend/                   # Python FastAPI backend
│   ├── src/                  # Source code
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic services
│   │   ├── models/           # Pydantic data models
│   │   ├── middleware/       # Custom middleware
│   │   ├── config/           # Configuration management
│   │   └── utils/            # Utility functions
│   ├── .env.example          # Environment variables template
│   ├── requirements.txt      # Python dependencies
│   └── main.py              # Application entry point
└── README.md                 # This file
```

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd shellkode-ai-chatbot
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env file with your AWS credentials and other settings
# Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

# Start the backend server
python main.py
```

The backend API will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Verify Installation

1. Open `http://localhost:5173` in your browser
2. You should see the Shellkode AI Chatbot interface
3. Try sending a test message to verify the connection

## 🛠️ Development

### Available Scripts

#### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

#### Backend
```bash
python main.py           # Start development server
python -m pytest        # Run tests (if available)
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Application Settings
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=http://localhost:5173

# Optional: Google OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🔧 Technologies

### Frontend Stack
- **React 18.2.0** - UI library with hooks and context
- **TypeScript 5.2.2** - Type-safe JavaScript
- **Vite 4.5.0** - Fast build tool and dev server
- **Tailwind CSS 3.3.5** - Utility-first CSS framework
- **React Router DOM 6.20.1** - Client-side routing
- **Lucide React 0.294.0** - Beautiful icons
- **Recharts 2.8.0** - Charts and data visualization
- **Class Variance Authority** - Component styling utilities

### Backend Stack
- **FastAPI 0.104+** - Modern Python web framework
- **Uvicorn** - ASGI server for FastAPI
- **Pydantic 2.5+** - Data validation and serialization
- **Boto3** - AWS SDK for Python
- **Python-Jose** - JWT token handling
- **Passlib** - Password hashing
- **HTTPX** - Async HTTP client
- **Aiofiles** - Async file operations

### Infrastructure
- **AWS Bedrock** - AI/ML services
- **IndexedDB** - Client-side storage
- **WebSocket-like Streaming** - Real-time communication

## 📚 Documentation

- [Frontend README](./Frontend/README.md) - Detailed frontend setup and development guide
- [Backend README](./backend/README.md) - Backend API documentation and setup
- [AWS Bedrock Setup](./backend/BEDROCK_SETUP.md) - AWS configuration guide
- [Frontend Guidelines](./Frontend/guidelines/Guidelines.md) - Development guidelines
- [Search Setup](./backend/setup_search.md) - Search functionality setup

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Verify Python version (3.8+)
- Check AWS credentials in `.env` file
- Ensure all dependencies are installed: `pip install -r requirements.txt`

**Frontend build errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version (18+)
- Verify TypeScript configuration

**CORS errors:**
- Ensure backend CORS_ORIGINS includes frontend URL
- Check that both servers are running on correct ports

**AWS Bedrock errors:**
- Verify AWS credentials and region
- Check IAM permissions for Bedrock access
- Refer to [BEDROCK_SETUP.md](./backend/BEDROCK_SETUP.md)

### Getting Help

1. Check the logs in both frontend and backend consoles
2. Verify all environment variables are set correctly
3. Ensure AWS credentials have proper permissions
4. Review the documentation links above

## 🚀 Deployment

### Docker Support

Both frontend and backend include Dockerfiles for containerized deployment.

```bash
# Build and run backend
cd backend
docker build -t shellkode-backend .
docker run -p 8000:8000 shellkode-backend

# Build and run frontend
cd Frontend
docker build -t shellkode-frontend .
docker run -p 5173:5173 shellkode-frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is proprietary to Shellkode Labs. All rights reserved.

---

<div align="center">
  <p>Built with ❤️ by the Shellkode Labs team</p>
</div># Shellkode-Chatbot
