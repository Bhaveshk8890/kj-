import React, { useState, useEffect, useRef } from 'react';


const StreamingText = ({ content, isStreaming }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!content) {
      setDisplayedContent('');
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
        
        // Auto scroll
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 20); // Adjust speed here

      return () => clearTimeout(timer);
    } else {
      setDisplayedContent(content);
    }
  }, [content, currentIndex]);

  // Reset when content changes significantly
  useEffect(() => {
    if (content.length < displayedContent.length) {
      setDisplayedContent('');
      setCurrentIndex(0);
    }
  }, [content]);

  const formatResponseText = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let key = 0;
    let listCounter = 1;
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle code blocks
      if (line.includes('<pre><code')) {
        inCodeBlock = true;
        const langMatch = line.match(/class="language-(\w+)"/);
        codeLanguage = langMatch ? langMatch[1] : 'text';
        codeContent = '';
        continue;
      }
      
      if (line.includes('</code></pre>')) {
        inCodeBlock = false;
        elements.push(
          <div key={key++} className="bg-[#0d1117] rounded-lg border border-gray-700 my-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700">
              <span className="text-xs text-gray-400 font-medium">{codeLanguage}</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm text-gray-200 leading-relaxed" style={{ fontFamily: 'DM Mono, monospace' }}>
                <code>{codeContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')}</code>
              </pre>
            </div>
          </div>
        );
        continue;
      }
      
      if (inCodeBlock) {
        codeContent += line + '\n';
        continue;
      }
      
      // Reset counter for new headers
      if (line.startsWith('## ') || line.startsWith('# ')) {
        listCounter = 1;
      }
      
      if (line.startsWith('## ')) {
        elements.push(<h3 key={key++} className="text-lg font-bold text-white mt-6 mb-3">{line.replace('## ', '')}</h3>);
      } else if (line.startsWith('# ')) {
        elements.push(<h2 key={key++} className="text-xl font-extrabold text-white mt-6 mb-4">{line.replace('# ', '')}</h2>);
      } else if (line.match(/^[\s]*[-*•]\s/)) {
        const content = line.replace(/^[\s]*[-*•]\s/, '');
        elements.push(
          <li key={key++} className="ml-4 mb-2 text-gray-100 list-none">
            <span className="text-blue-400 mr-2">•</span>
            <span>{content}</span>
          </li>
        );
      } else if (line.match(/^[\s]*\d+\.\s/)) {
        const numberMatch = line.match(/^[\s]*(\d+)\.(\s.*)/); 
        const originalNumber = numberMatch ? numberMatch[1] : listCounter.toString();
        const content = numberMatch ? numberMatch[2].trim() : line.replace(/^[\s]*\d+\.\s/, '');
        elements.push(
          <li key={key++} className="ml-4 mb-2 text-gray-100 list-none">
            <span className="text-blue-400 mr-2 font-medium">{originalNumber}.</span>
            <span>{content}</span>
          </li>
        );
        listCounter++;
      } else if (line.trim() === '') {
        elements.push(<div key={key++} className="h-3"></div>);
      } else if (line.trim()) {
        elements.push(<p key={key++} className="mb-3 text-gray-100 leading-relaxed">{line}</p>);
      }
    }

    return <div>{elements}</div>;
  };

  return (
    <div ref={containerRef} className="text-[#ffffff] text-lg font-light leading-relaxed w-full" style={{ fontFamily: 'Funnel Display, sans-serif' }}>
      {formatResponseText(displayedContent)}
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse">|</span>
      )}
    </div>
  );
};

export default StreamingText;