import React from 'react';
import { ModeSuggestion } from '../services/api';
import StreamingMessage from './StreamingMessage';
import ModeSuggestionBanner from './ModeSuggestionBanner';

const StreamingChatHandler = ({
  streamingContent,
  isStreaming,
  modeSuggestion,
  onModeSuggestionAccept,
  onModeSuggestionDismiss
}) => {
  return (
    <div className="space-y-4">
      {modeSuggestion && (
        <ModeSuggestionBanner
          suggestion={modeSuggestion}
          onAccept={onModeSuggestionAccept}
          onDismiss={onModeSuggestionDismiss}
        />
      )}

      {(isStreaming || streamingContent) && (
        <StreamingMessage
          content={streamingContent}
          isStreaming={isStreaming}
        />
      )}
    </div>
  );
};

export default StreamingChatHandler;