import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";

const chatReducer = (state, action) => {
  switch (action.type) {
    case "LOAD_SESSIONS":
      return {
        ...state,
        sessions: action.payload,
      };

    case "CREATE_SESSION":
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
      };

    case "UPDATE_SESSION":
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.sessionId
            ? {
                ...session,
                ...action.payload.session,
                lastActivity: new Date(),
              }
            : session
        ),
      };

    case "DELETE_SESSION":
      return {
        ...state,
        sessions: state.sessions.filter(
          (session) => session.id !== action.payload
        ),
        currentSessionId:
          state.currentSessionId === action.payload
            ? null
            : state.currentSessionId,
      };

    case "SET_CURRENT_SESSION":
      return {
        ...state,
        currentSessionId: action.payload,
      };

    case "ADD_MESSAGE":
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.sessionId
            ? {
                ...session,
                messages: [...session.messages, action.payload.message],
                lastActivity: new Date(),
              }
            : session
        ),
      };

    case "UPDATE_MESSAGE":
      console.log("UPDATE_MESSAGE:", action.payload);
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.sessionId
            ? {
                ...session,
                messages: session.messages.map((msg) =>
                  msg.id === action.payload.messageId
                    ? { ...msg, ...action.payload.updates }
                    : msg
                ),
                lastActivity: new Date(),
              }
            : session
        ),
      };

    case "UPDATE_SESSION_TITLE":
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.sessionId
            ? { ...session, title: action.payload.title }
            : session
        ),
      };

    case "SET_STREAMING_MESSAGE":
      return {
        ...state,
        streamingMessageId: action.payload,
      };

    default:
      return state;
  }
};

const ChatContext = createContext(undefined);

const STORAGE_KEY = "chat_sessions";

// Helper function to generate session title from first message
const generateSessionTitle = (messages) => {
  const firstUserMessage = messages.find((m) => m.type === "user");
  if (!firstUserMessage) return "New conversation";

  const content = firstUserMessage.content.trim();
  if (content.length <= 50) return content;
  return content.substring(0, 47) + "...";
};

// Helper function to format timestamp
const formatTimestamp = (date) => {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString();
};

export function ChatProvider({ children }) {
  const initialState = {
    sessions: [],
    currentSessionId: null,
    streamingMessageId: null,
  };

  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions).map((session) => ({
          ...session,
          lastActivity: new Date(session.lastActivity),
          messages: session.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            isStreaming: false, // Reset streaming state on load
            streamingContent: undefined,
          })),
        }));
        dispatch({ type: "LOAD_SESSIONS", payload: sessions });
      } catch (error) {
        console.error("Error loading chat sessions:", error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    if (state.sessions.length > 0) {
      try {
        // Don't save streaming state to localStorage
        const sessionsToSave = state.sessions.map((session) => ({
          ...session,
          messages: session.messages.map((msg) => ({
            ...msg,
            isStreaming: false,
            streamingContent: undefined,
          })),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsToSave));
      } catch (error) {
        console.error("Error saving sessions to localStorage:", error);
      }
    }
  }, [state.sessions]);

  const createNewSession = (mode = "research") => {
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newSession = {
      id: sessionId,
      title: "New conversation",
      timestamp: "Just now",
      mode,
      messages: [],
      lastActivity: new Date(),
    };

    dispatch({ type: "CREATE_SESSION", payload: newSession });
    dispatch({ type: "SET_CURRENT_SESSION", payload: sessionId });

    return sessionId;
  };

  const deleteSession = (sessionId) => {
    dispatch({ type: "DELETE_SESSION", payload: sessionId });
  };

  const addMessage = (sessionId, message) => {
    dispatch({ type: "ADD_MESSAGE", payload: { sessionId, message } });

    // Update session title if it's still the default and this is a user message
    const session = state.sessions.find((s) => s.id === sessionId);
    if (
      session &&
      session.title === "New conversation" &&
      message.type === "user"
    ) {
      const title = generateSessionTitle([message]);
      dispatch({ type: "UPDATE_SESSION_TITLE", payload: { sessionId, title } });
    }
  };

  const updateMessage = (sessionId, messageId, updates) => {
    dispatch({
      type: "UPDATE_MESSAGE",
      payload: { sessionId, messageId, updates },
    });
  };

  const updateSessionTitle = (sessionId, title) => {
    dispatch({ type: "UPDATE_SESSION_TITLE", payload: { sessionId, title } });
  };

  const getCurrentSession = () => {
    if (!state.currentSessionId) return null;
    return (
      state.sessions.find((session) => session.id === state.currentSessionId) ||
      null
    );
  };

  const setCurrentSession = useCallback((sessionId) => {
    dispatch({ type: "SET_CURRENT_SESSION", payload: sessionId });
  }, []);

  const setStreamingMessage = (messageId) => {
    dispatch({ type: "SET_STREAMING_MESSAGE", payload: messageId });
  };

  const saveCurrentSessionToHistory = () => {
    const currentSession = getCurrentSession();
    if (currentSession && currentSession.messages.length > 0) {
      const timestamp = formatTimestamp(new Date());
      dispatch({
        type: "UPDATE_SESSION",
        payload: {
          sessionId: currentSession.id,
          session: { timestamp },
        },
      });
    }
  };

  const contextValue = {
    state,
    createNewSession,
    deleteSession,
    addMessage,
    updateMessage,
    updateSessionTitle,
    getCurrentSession,
    setCurrentSession,
    saveCurrentSessionToHistory,
    setStreamingMessage,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
