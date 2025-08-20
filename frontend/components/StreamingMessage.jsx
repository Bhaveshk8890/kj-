import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';


const StreamingMessage = ({
  content,
  isStreaming,
  onComplete
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayedContent(content);
    
    if (!isStreaming && onComplete) {
      onComplete(content);
    }
  }, [content, isStreaming, onComplete]);

  // Blinking cursor effect
  useEffect(() => {
    if (!isStreaming) {
      setShowCursor(false);
      return;
    }

    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Function to format inline text with HTML tags
  const formatInlineText = (text) => {
    let formattedText = text
      // Bold tags
      .replace(/<strong>(.*?)<\/strong>/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/<b>(.*?)<\/b>/g, '<strong class="font-bold text-white">$1</strong>')
      // Italic tags
      .replace(/<em>(.*?)<\/em>/g, '<em class="italic text-gray-200">$1</em>')
      .replace(/<i>(.*?)<\/i>/g, '<em class="italic text-gray-200">$1</em>')
      // Inline code tags
      .replace(/<code>(.*?)<\/code>/g, '<code class="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-blue-300" style="font-family: \'DM Mono\', monospace;">$1</code>');

    return formattedText;
  };

  // Function to format response text to JSX
  const formatResponseText = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let key = 0;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      
      // Headers
      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={key++} className="text-lg font-bold text-white mt-6 mb-3">
            {line.replace('## ', '')}
          </h3>
        );
        i++;
      } else if (line.startsWith('# ')) {
        elements.push(
          <h2 key={key++} className="text-xl font-extrabold text-white mt-6 mb-4">
            {line.replace('# ', '')}
          </h2>
        );
        i++;
      }
      // Numbered lists - group consecutive numbered items
      else if (line.match(/^[\s]*\d+\.\s/)) {
        const numberedItems = [];
        let itemKey = 0;
        
        // Collect all consecutive numbered items and sub-bullets
        while (i < lines.length) {
          const currentLine = lines[i];
          
          if (currentLine.match(/^[\s]*\d+\.\s/)) {
            const numberMatch = currentLine.match(/^[\s]*(\d+)\.(\s.*)/); 
            const originalNumber = numberMatch ? numberMatch[1] : '1';
            const content = numberMatch ? numberMatch[2].trim() : currentLine.replace(/^[\s]*\d+\.\s/, '');
            numberedItems.push(
              <li key={itemKey++} className="mb-2 text-gray-100 list-none">
                <span className="text-blue-400 mr-2 font-medium">{originalNumber}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineText(content) }} />
              </li>
            );
            i++;
            
            // Check for sub-bullets under this numbered item
            while (i < lines.length && lines[i].match(/^[\s]*[-*•]\s/)) {
              const subContent = lines[i].replace(/^[\s]*[-*•]\s/, '');
              numberedItems.push(
                <ul key={itemKey++} className="ml-6 mt-1">
                  <li className="mb-1 text-gray-100 list-disc">
                    <span dangerouslySetInnerHTML={{ __html: formatInlineText(subContent) }} />
                  </li>
                </ul>
              );
              i++;
            }
          } else {
            break;
          }
        }
        
        elements.push(
          <div key={key++} className="ml-4 mb-4">
            {numberedItems}
          </div>
        );
      }
      // Bullet points - group consecutive bullet items
      else if (line.match(/^[\s]*[-*•]\s/)) {
        const bulletItems = [];
        let itemKey = 0;
        
        while (i < lines.length && lines[i].match(/^[\s]*[-*•]\s/)) {
          const content = lines[i].replace(/^[\s]*[-*•]\s/, '');
          bulletItems.push(
            <li key={itemKey++} className="mb-2 text-gray-100">
              <span dangerouslySetInnerHTML={{ __html: formatInlineText(content) }} />
            </li>
          );
          i++;
        }
        
        elements.push(
          <ul key={key++} className="ml-4 mb-4 list-disc">
            {bulletItems}
          </ul>
        );
      }
      // Empty lines for spacing
      else if (line.trim() === '') {
        elements.push(<div key={key++} className="h-3"></div>);
        i++;
      }
      // Regular paragraphs
      else if (line.trim()) {
        elements.push(
          <p key={key++} className="mb-3 text-gray-100 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: formatInlineText(line) }} />
          </p>
        );
        i++;
      } else {
        i++;
      }
    }

    return <div>{elements}</div>;
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[#ffffff] text-lg font-light leading-relaxed" style={{ fontFamily: 'Funnel Display, sans-serif' }}>
          {formatResponseText(displayedContent)}
          {isStreaming && (
            <span className={`inline-block w-2 h-5 bg-blue-400 ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
              |
            </span>
          )}
        </div>
        {isStreaming && (
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="text-gray-400 text-xs ml-2">AI is typing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingMessage;