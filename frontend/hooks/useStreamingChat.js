import { useState, useCallback } from 'react';
import { ApiService } from '../services/api';
import { useChatContext } from '../components/ChatContext';

export const useStreamingChat = ({ sessionId, onModeSuggestion, onError }) => {
  const { addMessage, updateMessage, setStreamingMessage } = useChatContext();
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);

  const sendStreamingMessage = useCallback(async (
    content,
    mode,
    activeSessionId,
    code,
    error
  ) => {
    if (!activeSessionId) return;

    setIsStreaming(true);
    setCurrentSessionId(activeSessionId);
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      mode
    };
    addMessage(activeSessionId, userMessage);

    // Create streaming assistant message
    const assistantMessageId = `assistant_${Date.now()}`;
    const assistantMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      mode,
      isStreaming: true,
      streamingContent: ''
    };
    
    addMessage(activeSessionId, assistantMessage);
    setCurrentStreamingMessageId(assistantMessageId);
    setStreamingMessage(assistantMessageId);

    const callbacks = {
      onStart: (messageId, requestId) => {
        console.log('Streaming started:', messageId, 'Request ID:', requestId);
        setCurrentRequestId(requestId);
      },

      onContent: (contentChunk, accumulatedContent) => {
        console.log('Received content chunk:', contentChunk);
        console.log('Accumulated content:', accumulatedContent);
        updateMessage(activeSessionId, assistantMessageId, {
          streamingContent: accumulatedContent,
          content: accumulatedContent,
          timestamp: new Date()
        });
      },

      onModeSuggestion: (suggestion) => {
        onModeSuggestion?.(suggestion);
      },

      onEnd: (finalContent, messageId) => {
        updateMessage(activeSessionId, assistantMessageId, {
          content: finalContent,
          isStreaming: false,
          streamingContent: undefined
        });
        
        setIsStreaming(false);
        setCurrentStreamingMessageId(null);
        setCurrentRequestId(null);
        setStreamingMessage(null);
      },

      onStopped: (message) => {
        console.log('Streaming stopped:', message);
        updateMessage(activeSessionId, assistantMessageId, {
          isStreaming: false,
          streamingContent: undefined
        });
        
        setIsStreaming(false);
        setCurrentStreamingMessageId(null);
        setCurrentSessionId(null);
        setCurrentRequestId(null);
        setStreamingMessage(null);
      },

      onError: (errorMessage) => {
        updateMessage(activeSessionId, assistantMessageId, {
          content: `Sorry, I encountered an error: ${errorMessage}`,
          isStreaming: false,
          streamingContent: undefined
        });
        
        setIsStreaming(false);
        setCurrentStreamingMessageId(null);
        setCurrentSessionId(null);
        setCurrentRequestId(null);
        setStreamingMessage(null);
        onError?.(errorMessage);
      },

      onDone: () => {
        console.log('Streaming completed');
      }
    };

    try {
      console.log('Starting streaming message:', { content, mode, activeSessionId });
      await ApiService.sendMessageStream({
        content,
        mode,
        session_id: activeSessionId,
        code,
        error
      }, callbacks);
    } catch (error) {
      console.error('Streaming error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      updateMessage(activeSessionId, assistantMessageId, {
        content: `Sorry, I encountered an error: ${errorMessage}`,
        isStreaming: false,
        streamingContent: undefined
      });
      
      setIsStreaming(false);
      setCurrentStreamingMessageId(null);
      setCurrentSessionId(null);
      setCurrentRequestId(null);
      setStreamingMessage(null);
      onError?.(errorMessage);
    }
  }, [addMessage, updateMessage, setStreamingMessage, onModeSuggestion, onError]);

  const rerunWithMode = useCallback(async (
    content,
    newMode,
    activeSessionId
  ) => {
    if (!activeSessionId) return;

    setIsStreaming(true);
    
    const assistantMessageId = `assistant_rerun_${Date.now()}`;
    const assistantMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      mode: newMode,
      isStreaming: true,
      streamingContent: ''
    };
    
    addMessage(activeSessionId, assistantMessage);
    setCurrentStreamingMessageId(assistantMessageId);
    setStreamingMessage(assistantMessageId);

    const callbacks = {
      onStart: (messageId) => {
        console.log('Rerun streaming started:', messageId);
      },

      onContent: (contentChunk, accumulatedContent) => {
        updateMessage(activeSessionId, assistantMessageId, {
          streamingContent: accumulatedContent,
          content: accumulatedContent
        });
      },

      onEnd: (finalContent, messageId) => {
        updateMessage(activeSessionId, assistantMessageId, {
          content: finalContent,
          isStreaming: false,
          streamingContent: undefined
        });
        
        setIsStreaming(false);
        setCurrentStreamingMessageId(null);
        setStreamingMessage(null);
      },

      onError: (errorMessage) => {
        updateMessage(activeSessionId, assistantMessageId, {
          content: `Sorry, I encountered an error: ${errorMessage}`,
          isStreaming: false,
          streamingContent: undefined
        });
        
        setIsStreaming(false);
        setCurrentStreamingMessageId(null);
        setStreamingMessage(null);
        onError?.(errorMessage);
      },

      onDone: () => {
        console.log('Rerun streaming completed');
      }
    };

    try {
      await ApiService.rerunMessageWithModeStream(
        content,
        newMode,
        activeSessionId,
        callbacks
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      updateMessage(activeSessionId, assistantMessageId, {
        content: `Sorry, I encountered an error: ${errorMessage}`,
        isStreaming: false,
        streamingContent: undefined
      });
      
      setIsStreaming(false);
      setCurrentStreamingMessageId(null);
      setStreamingMessage(null);
      onError?.(errorMessage);
    }
  }, [addMessage, updateMessage, setStreamingMessage, onError]);

  const stopStreaming = useCallback(async () => {
    try {
      if (currentRequestId && isStreaming) {
        await ApiService.stopStreaming(currentRequestId);
      }
    } catch (error) {
      console.error('Error stopping stream:', error);
    } finally {
      // Always cleanup state regardless of API success/failure
      setIsStreaming(false);
      setCurrentStreamingMessageId(null);
      setCurrentSessionId(null);
      setCurrentRequestId(null);
      setStreamingMessage(null);
    }
  }, [currentRequestId, isStreaming, setStreamingMessage]);

  return {
    sendStreamingMessage,
    rerunWithMode,
    stopStreaming,
    isStreaming,
    currentStreamingMessageId
  };
};