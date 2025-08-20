import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import LogoIcon from "./../assets/icons/Logo_icon.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import VoiceRecorder from "./VoiceRecorder";
import { useChatContext } from "./ChatContext";
import { useStreamingChat } from "../hooks/useStreamingChat";
import StreamingMessage from "./StreamingMessage";
import ModeSuggestionBanner from "./ModeSuggestionBanner";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Search,
  Paperclip,
  Send,
  Bot,
  Code,
  FileText,
  Zap,
  Wrench,
  Sparkles,
  X,
  Copy,
  ExternalLink,
  AlertTriangle,
  Activity,
  Clock,
  Plus,
  Download,
  MessageSquarePlus,
  MoreVertical,
  ChevronRight,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Square,
} from "lucide-react";

// Icon Components using Lucide React
const FileTextIcon = () => <FileText className="size-[15px]" />;
const WorkflowIcon = () => <Activity className="size-[15px]" />;
const RegenerateIcon = () => <RotateCcw className="size-4" />;
const CopyIcon = () => <Copy className="size-4" />;
const ExportIcon = () => <Download className="size-4" />;
const ThumbsUpIcon = () => <ThumbsUp className="size-4" />;
const ThumbsDownIcon = () => <ThumbsDown className="size-4" />;

export default function ChatInterface() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const {
    state,
    createNewSession,
    addMessage,

    getCurrentSession,
    setCurrentSession,
    deleteSession,
  } = useChatContext();

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentMode, setCurrentMode] = useState(null);
  const [previousMode, setPreviousMode] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [activeTab, setActiveTab] = useState({});
  const [copiedStates, setCopiedStates] = useState({});
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [codeBlockExpanded, setCodeBlockExpanded] = useState({});
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const [modeSuggestion, setModeSuggestion] = useState(null);
  const [isInputVisible, setIsInputVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  // Troubleshoot mode states
  const [troubleshootCode, setTroubleshootCode] = useState("");
  const [troubleshootError, setTroubleshootError] = useState("");
  const [troubleshootComments, setTroubleshootComments] = useState("");

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Streaming chat hook
  const { sendStreamingMessage, stopStreaming, isStreaming } = useStreamingChat(
    {
      sessionId,
      onModeSuggestion: setModeSuggestion,
      onError: (error) => console.error("Streaming error:", error),
    }
  );

  useEffect(() => {
    if (sessionId) {
      setCurrentSession(sessionId);
    } else {
      setCurrentSession(null);
    }
  }, [sessionId]);

  useEffect(() => {
    if (currentMode !== "troubleshoot") {
      clearTroubleshootForm();
    }
  }, [currentMode]);

  const currentSession = getCurrentSession();
  const messages = currentSession?.messages || [];

  useEffect(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom, messages]);



  // Group messages into conversation pairs
  const conversationPairs = [];
  
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    
    if (message?.type === "user") {
      const assistantMessage = messages[i + 1];
      conversationPairs.push({
        id: `pair-${message.id}`,
        userMessage: message,
        assistantMessage:
          assistantMessage?.type === "assistant" ? assistantMessage : null,
      });
      if (assistantMessage?.type === "assistant") i++; // Skip the assistant message in next iteration
    }
  }

  const chatModes = [
    {
      id: "research",
      label: "Research",
      icon: Search,
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      activeColor: "bg-blue-500 text-white border-blue-500",
    },
    {
      id: "troubleshoot",
      label: "Troubleshoot",
      icon: Wrench,
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      activeColor: "bg-orange-500 text-white border-orange-500",
    },
    {
      id: "code",
      label: "Code",
      icon: Code,
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      activeColor: "bg-green-500 text-white border-green-500",
    },
  ];

  const quickActions = [
    {
      icon: Code,
      label: "Code Generation",
      query: "Help me generate code for...",
      mode: "code",
    },
    {
      icon: Search,
      label: "Deep Research",
      query: "Research this topic in depth...",
      mode: "research",
    },
    {
      icon: FileText,
      label: "Debug Code",
      query: "Help me debug this code...",
      mode: "troubleshoot",
    },
    {
      icon: Zap,
      label: "Quick Answer",
      query: "Give me a quick answer about...",
      mode: "standard",
    },
  ];

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [id]: true }));
      setTimeout(
        () => setCopiedStates((prev) => ({ ...prev, [id]: false })),
        2000
      );
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const parseCodeBlocks = (content) => {
    const codeBlockRegex =
      /<pre><code(?:\s+class="language-(\w+)")?[^>]*>([\s\S]*?)<\/code><\/pre>/g;
    const codeBlocks = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const codeContent = match[2];
      if (codeContent) {
        codeBlocks.push({
          language: match[1] || "text",
          content: codeContent
            .trim()
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&"),
          id: `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
      }
    }

    return codeBlocks;
  };

  const getFilteredContent = (content) => {
    if (!content) return "";
    return content
      .replace(
        /<pre><code(?:\s+class="language-\w+")?[\s\S]*?<\/code><\/pre>/g,
        ""
      )
      .trim();
  };

  const formatInlineText = (text) => {
    return text
      .replace(
        /<strong>(.*?)<\/strong>/g,
        '<strong class="font-bold text-white">$1</strong>'
      )
      .replace(
        /<b>(.*?)<\/b>/g,
        '<strong class="font-bold text-white">$1</strong>'
      )
      .replace(/<em>(.*?)<\/em>/g, '<em class="italic text-gray-200">$1</em>')
      .replace(/<i>(.*?)<\/i>/g, '<em class="italic text-gray-200">$1</em>')
      .replace(
        /<code>(.*?)<\/code>/g,
        '<code class="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-blue-300" style="font-family: \'DM Mono\', monospace;">$1</code>'
      );
  };

  const renderMixedContent = (content, messageId) => {
    const elements = [];
    let key = 0;

    // Split content by code blocks while preserving them
    const parts = content.split(
      /(<pre><code(?:\s+class="language-\w+")?[^>]*>[\s\S]*?<\/code><\/pre>)/g
    );

    parts.forEach((part, index) => {
      if (
        part.match(
          /<pre><code(?:\s+class="language-\w+")?[^>]*>[\s\S]*?<\/code><\/pre>/
        )
      ) {
        // This is a code block
        const codeMatch = part.match(
          /<pre><code(?:\s+class="language-(\w+)")?[^>]*>([\s\S]*?)<\/code><\/pre>/
        );
        if (codeMatch) {
          const language = codeMatch[1] || "text";
          const codeContent = codeMatch[2]
            .trim()
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&");
          const blockId = `msg-${messageId}-code-${index}`;

          elements.push(
            <CodeBlock
              key={blockId}
              language={language}
              content={codeContent}
              blockId={blockId}
            />
          );
        }
      } else if (part.trim()) {
        // This is regular text content
        const textElements = formatResponseText(part);
        elements.push(<div key={key++}>{textElements}</div>);
      }
    });

    return <div>{elements}</div>;
  };

  const formatResponseText = (text) => {
    const lines = text.split("\n");
    const elements = [];
    let key = 0;

    for (const line of lines) {
      if (line.startsWith("## ")) {
        elements.push(
          <h3 key={key++} className="text-lg font-bold text-white mt-6 mb-3">
            {line.replace("## ", "")}
          </h3>
        );
      } else if (line.startsWith("# ")) {
        elements.push(
          <h2
            key={key++}
            className="text-xl font-extrabold text-white mt-6 mb-4"
          >
            {line.replace("# ", "")}
          </h2>
        );
      } else if (line.match(/^[\s]*[-*•]\s/)) {
        const content = line.replace(/^[\s]*[-*•]\s/, "");
        elements.push(
          <li
            key={key++}
            className="ml-4 mb-2 text-gray-100"
            dangerouslySetInnerHTML={{ __html: formatInlineText(content) }}
          />
        );
      } else if (line.match(/^[\s]*\d+\.\s/)) {
        const numberMatch = line.match(/^[\s]*(\d+)\.(\s.*)/);
        const originalNumber = numberMatch ? numberMatch[1] : "1";
        const content = numberMatch
          ? numberMatch[2].trim()
          : line.replace(/^[\s]*\d+\.\s/, "");
        elements.push(
          <li
            key={key++}
            className="ml-4 mb-2 text-gray-100 list-none"
            dangerouslySetInnerHTML={{
              __html: `<span class="text-blue-400 mr-2 font-medium">${originalNumber}.</span>${formatInlineText(
                content
              )}`,
            }}
          />
        );
      } else if (line.trim() === "") {
        elements.push(<div key={key++} className="h-3"></div>);
      } else if (line.trim()) {
        elements.push(
          <p
            key={key++}
            className="mb-3 text-gray-100 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatInlineText(line) }}
          />
        );
      }
    }

    return elements;
  };

  const CodeBlock = ({ language, content, blockId }) => {
    const isExpanded = codeBlockExpanded[blockId] || false;
    const lines = content.split("\n");
    const isLarge = lines.length > 15;
    const displayContent =
      isLarge && !isExpanded ? lines.slice(0, 15).join("\n") : content;

    const toggleExpanded = () => {
      setCodeBlockExpanded(prev => ({
        ...prev,
        [blockId]: !isExpanded
      }));
    };

    return (
      <div className="bg-[#0d1117] rounded-xl border border-gray-700 my-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700">
          <span className="text-xs text-gray-400 font-medium">{language}</span>
          <div className="flex items-center gap-2">
            {isLarge && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
              >
                {isExpanded
                  ? "Collapse"
                  : `Expand (+${lines.length - 15} lines)`}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(content, blockId)}
              className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
            >
              {copiedStates[blockId] ? (
                <>
                  <div className="w-3 h-3 text-green-400 mr-1">✓</div>
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{
              fontSize: '14px',
              fontFamily: 'DM Mono, monospace',
              lineHeight: '1.5',
              margin: 0,
              padding: 0
            }}
          >
            {displayContent}
          </SyntaxHighlighter>
          {isLarge && !isExpanded && (
            <div className="text-center pt-2 border-t border-gray-700 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="text-xs text-gray-400 hover:text-white"
              >
                Show {lines.length - 15} more lines
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSendMessage = async () => {
    if (currentMode === "troubleshoot") {
      return handleTroubleshootSubmit();
    }

    if (!input.trim() && attachedFiles.length === 0) return;

    const messageToSend = input;

    // Clear input immediately
    setInput("");
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "50px";
    }

    let activeSessionId = sessionId;
    if (!sessionId || !currentSession) {
      activeSessionId = createNewSession(currentMode);
      navigate(`/chat/${activeSessionId}`);
    }

    if (activeSessionId) {
      setShouldScrollToBottom(true);
      await sendStreamingMessage(messageToSend, currentMode || "standard", activeSessionId);
    }
  };

  const handleTroubleshootSubmit = async () => {
    if (!troubleshootError.trim()) return;

    const content = `Issue: ${troubleshootError}${
      troubleshootCode ? `\n\nCode:\n${troubleshootCode}` : ""
    }${troubleshootComments ? `\n\nContext:\n${troubleshootComments}` : ""}`;

    let activeSessionId = sessionId;
    if (!sessionId || !currentSession) {
      activeSessionId = createNewSession(currentMode);
      navigate(`/chat/${activeSessionId}`);
    }

    if (activeSessionId) {
      setShouldScrollToBottom(true);
      await sendStreamingMessage(
        content,
        currentMode,
        activeSessionId,
        troubleshootCode,
        troubleshootError
      );
    }

    clearTroubleshootForm();
  };

  const clearTroubleshootForm = () => {
    setTroubleshootCode("");
    setTroubleshootError("");
    setTroubleshootComments("");
  };

  const handleTroubleshootFollowUp = async (content) => {
    let activeSessionId = sessionId;
    if (!sessionId || !currentSession) {
      activeSessionId = createNewSession(currentMode);
      navigate(`/chat/${activeSessionId}`);
    }

    if (activeSessionId) {
      await sendStreamingMessage(content, currentMode, activeSessionId);
    }
  };

  const handleRegenerateResponse = async (originalQuery) => {
    let activeSessionId = sessionId;
    if (!sessionId || !currentSession) {
      activeSessionId = createNewSession(currentMode);
      navigate(`/chat/${activeSessionId}`);
    }

    if (activeSessionId) {
      await sendStreamingMessage(originalQuery, currentMode, activeSessionId);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (query, mode) => {
    setInput(query);
    setCurrentMode(mode);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleNewChat = () => {
    const newSessionId = createNewSession("standard");
    setInput("");
    setAttachedFiles([]);
    setActiveTab({});
    setCurrentMode(null);
    navigate(`/chat/${newSessionId}`);
  };

  const handleVoiceTranscription = (text) => {
    setInput(text);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getActiveTab = (pairId) => activeTab[pairId] || "answer";
  const setActiveTabForPair = (pairId, tab) => {
    setActiveTab((prev) => ({ ...prev, [pairId]: tab }));
  };

  const getTabUnderlineStyles = (
    pairId,
    currentTab,
    tabWidth,
    tabOffset
  ) => {
    if (getActiveTab(pairId) === currentTab) {
      return {
        position: "absolute",
        height: 0,
        left: `${tabOffset}px`,
        top: "35px",
        width: `${tabWidth}px`,
      };
    }
    return { display: "none" };
  };

  // Troubleshoot mode layout
  if (currentMode === "troubleshoot") {
    return (
      <div className="bg-[#000000] relative h-screen flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-400" />
              <h1 className="text-lg font-medium text-white">
                Troubleshoot Mode
              </h1>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-900/50 border border-gray-700">
              {chatModes.map((mode) => (
                <Button
                  key={mode.id}
                  onClick={() => setCurrentMode(mode.id)}
                  size="sm"
                  variant="ghost"
                  className={`h-8 px-3 rounded-lg transition-all ${
                    currentMode === mode.id
                      ? mode.activeColor
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <mode.icon className="w-4 h-4 mr-2" />
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={clearTroubleshootForm}
              variant="ghost"
              size="sm"
              className="h-9 px-3 bg-gray-900/50 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded-xl"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              onClick={handleNewChat}
              variant="ghost"
              size="sm"
              className="h-9 px-3 bg-gray-900/50 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded-xl"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 border-r border-gray-800 flex flex-col">
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white">
                  Describe Your Issue
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    What problem are you facing?
                  </label>
                  <textarea
                    value={troubleshootError}
                    onChange={(e) => setTroubleshootError(e.target.value)}
                    placeholder="Describe the issue you're experiencing, error messages, unexpected behavior..."
                    className="min-h-24 max-h-48 text-sm bg-gray-900/50 border border-gray-700 text-white placeholder:text-gray-500 resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none rounded-md p-3 w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Related Code (Optional)
                  </label>
                  <textarea
                    value={troubleshootCode}
                    onChange={(e) => setTroubleshootCode(e.target.value)}
                    placeholder="If your issue involves code, paste it here..."
                    className="min-h-32 max-h-64 font-mono text-sm bg-gray-900/50 border border-gray-700 text-white placeholder:text-gray-500 resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none rounded-md p-3 w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    value={troubleshootComments}
                    onChange={(e) => setTroubleshootComments(e.target.value)}
                    placeholder="Environment details, what you've already tried, expected vs actual behavior..."
                    className="min-h-20 max-h-32 text-sm bg-gray-900/50 border border-gray-700 text-white placeholder:text-gray-500 resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none rounded-md p-3 w-full"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800">
              <Button
                onClick={isStreaming ? stopStreaming : handleTroubleshootSubmit}
                disabled={!isStreaming && !troubleshootError.trim()}
                className={`w-full text-white ${
                  isStreaming
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {isStreaming ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4 mr-2" />
                    Get Solution
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-sm font-medium text-white">
                Analysis Results
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {conversationPairs.length > 0 ? (
                <div className="space-y-3">
                  {conversationPairs
                    .slice()
                    .reverse()
                    .map((pair, index) => {
                      const isExpanded = expandedAccordions[pair.id] ?? (index === 0);

                      return (
                        <div
                          key={pair.id}
                          className="bg-gray-900/30 border border-gray-700 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setExpandedAccordions((prev) => ({
                                [pair.id]: !isExpanded,
                              }))
                            }
                            className="w-full p-4 text-left hover:bg-gray-800/50 transition-colors flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">
                                {pair.userMessage.content.length > 80
                                  ? pair.userMessage.content.substring(0, 80) +
                                    "..."
                                  : pair.userMessage.content}
                              </div>
                              <div className="text-gray-400 text-xs mt-1">
                                {pair.assistantMessage
                                  ? "Solution provided"
                                  : "Processing..."}
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-700 p-4 space-y-4">
                              <div className="text-white text-sm">
                                {pair.userMessage.content}
                              </div>
                              {pair.assistantMessage && (
                                <div className="space-y-3">
                                  <div className="text-gray-200 text-sm leading-relaxed">
                                    {renderMixedContent(
                                      pair.assistantMessage.content,
                                      pair.assistantMessage.id
                                    )}
                                  </div>

                                  {/* Follow-up input */}
                                  <div className="mt-4 pt-4 border-t border-gray-700">
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Ask a follow-up question..."
                                        className="flex-1 text-sm bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 rounded-md px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none"
                                        onKeyPress={(e) => {
                                          if (
                                            e.key === "Enter" &&
                                            e.currentTarget.value.trim()
                                          ) {
                                            const followUpContent = `Follow-up to: "${pair.userMessage.content}"\n\nQuestion: ${e.currentTarget.value}`;
                                            handleTroubleshootFollowUp(
                                              followUpContent
                                            );
                                            e.currentTarget.value = "";
                                          }
                                        }}
                                      />
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          const input =
                                            e.currentTarget.parentElement?.querySelector(
                                              "input"
                                            );
                                          if (input?.value.trim()) {
                                            const followUpContent = `Follow-up to: "${pair.userMessage.content}"\n\nQuestion: ${input.value}`;
                                            handleTroubleshootFollowUp(
                                              followUpContent
                                            );
                                            input.value = "";
                                          }
                                        }}
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-3"
                                      >
                                        <Send className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  {isStreaming && (
                    <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-center space-y-4 flex-col">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                          <span className="text-orange-400 font-medium">
                            Analyzing your issue...
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <p className="text-gray-400 text-xs text-center max-w-sm">
                          Please wait while I analyze your code and generate a
                          solution...
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : isStreaming ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
                    <h4 className="font-medium text-orange-400">
                      Analyzing Issue
                    </h4>
                    <p className="text-sm text-gray-400 max-w-sm">
                      Processing your code and error details to generate a
                      solution...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-3">
                    <Wrench className="w-12 h-12 text-gray-500 mx-auto" />
                    <h4 className="font-medium text-white">Ready to Help</h4>
                    <p className="text-sm text-gray-400 max-w-sm">
                      Fill in your code and error details on the left, then
                      click "Get Solution" to get started.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#000000] relative h-screen flex flex-col">
      {modeSuggestion && (
        <ModeSuggestionBanner
          suggestion={modeSuggestion}
          onAccept={(mode) => {
            setCurrentMode(mode);
            setModeSuggestion(null);
          }}
          onDismiss={() => setModeSuggestion(null)}
        />
      )}

      <div className="absolute top-0 right-0 z-50 p-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="sm"
            className="h-9 px-3 bg-gray-900/50 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded-xl"
          >
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 bg-gray-900/50 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded-xl"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  if (currentSession) {
                    deleteSession(currentSession.id);
                    navigate("/chat");
                  }
                }}
                disabled={conversationPairs.length === 0}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className={`flex-1 overflow-hidden transition-all duration-700 ease-out ${
        isInputVisible ? 'pb-44' : 'pb-0'
      }`}>
        <div className="h-full overflow-y-auto" onScroll={(e) => {
          const currentScrollY = e.target.scrollTop;
          const isScrollingDown = currentScrollY > lastScrollY;
          const isNearBottom = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 100;
          
          if (isScrollingDown && currentScrollY > 100 && !isNearBottom) {
            setIsInputVisible(false);
          } else if (!isScrollingDown || isNearBottom) {
            setIsInputVisible(true);
          }
          
          setLastScrollY(currentScrollY);
        }}>
          {conversationPairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full space-y-12 px-8 py-12">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-white mb-2">
                    How can I help you today?
                  </h2>
                  <p className="text-gray-400 text-base max-w-md mx-auto">
                    Choose a mode below or ask me anything directly
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {quickActions.map((action, index) => (
                  <Card
                    key={index}
                    className="bg-black border-gray-800 hover:bg-gray-900 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg group"
                    onClick={() => handleQuickAction(action.query, action.mode)}
                  >
                    <CardContent className="p-6 flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                          action.mode === "code"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : action.mode === "research"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : action.mode === "troubleshoot"
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        <action.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <span className="text-white font-medium group-hover:text-blue-400 transition-colors text-sm">
                          {action.label}
                        </span>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                          {chatModes.find((m) => m.id === action.mode)?.label ||
                            "Quick assistance"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-center w-full px-6 pt-6 pb-6">
              <div className="space-y-20 w-full max-w-4xl">
                {conversationPairs.map((pair, pairIndex) => {
                  return (
                    <div key={pair.id} className="relative">
                      {pairIndex > 0 && (
                        <div className="absolute -top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-500 to-transparent shadow-sm"></div>
                      )}

                      <div className="box-border content-stretch flex flex-col gap-4 items-start justify-start relative w-full mx-auto">
                      {/* Sticky User Query Header and Tabs */}
                      <div className="sticky top-0 bg-[#000000] z-30 pt-4 pb-4 w-full">
                        {/* User Query Header */}
                        <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                          <p className="text-white text-lg leading-relaxed font-medium line-clamp-2">
                            {pair.userMessage.content}
                          </p>
                        </div>

                        {/* Assistant Response Tabs */}
                        {pair.assistantMessage && (
                          <div className="h-[35px] relative shrink-0 w-full">
                            <div className="absolute box-border content-stretch flex flex-row gap-6 items-center justify-start left-0 px-1 py-0 top-0">
                              {/* Answer Tab */}
                              <button
                                onClick={() =>
                                  setActiveTabForPair(pair.id, "answer")
                                }
                                className={`box-border content-stretch flex flex-row gap-[7px] items-center justify-start p-0 relative shrink-0 transition-all duration-200 ${
                                  getActiveTab(pair.id) === "answer"
                                    ? ""
                                    : "opacity-60 hover:opacity-80"
                                }`}
                              >
                                <img src={LogoIcon} />
                                <div
                                  className={`text-sm text-left text-nowrap transition-colors duration-200 ${
                                    getActiveTab(pair.id) === "answer"
                                      ? "text-white"
                                      : "text-[rgba(255,255,255,0.6)]"
                                  }`}
                                >
                                  <p className="block leading-relaxed whitespace-pre">
                                    Answer
                                  </p>
                                </div>
                              </button>

                              {/* Source Tab */}
                              {pair.assistantMessage.sources && (
                                <button
                                  onClick={() =>
                                    setActiveTabForPair(pair.id, "sources")
                                  }
                                  className={`box-border content-stretch flex flex-row gap-[7px] items-center justify-start p-0 relative shrink-0 transition-all duration-200 ${
                                    getActiveTab(pair.id) === "sources"
                                      ? ""
                                      : "opacity-60 hover:opacity-80"
                                  }`}
                                >
                                  <FileTextIcon />
                                  <div
                                    className={`text-sm text-left text-nowrap transition-colors duration-200 ${
                                      getActiveTab(pair.id) === "sources"
                                        ? "text-white"
                                        : "text-[rgba(255,255,255,0.6)]"
                                    }`}
                                  >
                                    <p className="block leading-relaxed whitespace-pre">
                                      Source -{" "}
                                      {pair.assistantMessage.sources.length}
                                    </p>
                                  </div>
                                </button>
                              )}

                              {/* Mode-specific tabs */}
                              {pair.userMessage.mode === "code" && (
                                <>
                                  <button
                                    onClick={() =>
                                      setActiveTabForPair(
                                        pair.id,
                                        "explanation"
                                      )
                                    }
                                    className={`box-border content-stretch flex flex-row gap-[7px] items-center justify-start p-0 relative shrink-0 transition-all duration-200 ${
                                      getActiveTab(pair.id) === "explanation"
                                        ? ""
                                        : "opacity-60 hover:opacity-80"
                                    }`}
                                  >
                                    <FileTextIcon />
                                    <div
                                      className={`text-sm text-left text-nowrap transition-colors duration-200 ${
                                        getActiveTab(pair.id) === "explanation"
                                          ? "text-white"
                                          : "text-[rgba(255,255,255,0.6)]"
                                      }`}
                                    >
                                      <p className="block leading-relaxed whitespace-pre">
                                        Explanation
                                      </p>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() =>
                                      setActiveTabForPair(pair.id, "tests")
                                    }
                                    className={`box-border content-stretch flex flex-row gap-[7px] items-center justify-start p-0 relative shrink-0 transition-all duration-200 ${
                                      getActiveTab(pair.id) === "tests"
                                        ? ""
                                        : "opacity-60 hover:opacity-80"
                                    }`}
                                  >
                                    <WorkflowIcon />
                                    <div
                                      className={`text-sm text-left text-nowrap transition-colors duration-200 ${
                                        getActiveTab(pair.id) === "tests"
                                          ? "text-white"
                                          : "text-[rgba(255,255,255,0.6)]"
                                      }`}
                                    >
                                      <p className="block leading-relaxed whitespace-pre">
                                        Tests
                                      </p>
                                    </div>
                                  </button>
                                </>
                              )}

                              {pair.userMessage.mode === "research" &&
                                pair.assistantMessage.sources && (
                                  <button
                                    onClick={() =>
                                      setActiveTabForPair(pair.id, "summary")
                                    }
                                    className={`box-border content-stretch flex flex-row gap-[7px] items-center justify-start p-0 relative shrink-0 transition-all duration-200 ${
                                      getActiveTab(pair.id) === "summary"
                                        ? ""
                                        : "opacity-60 hover:opacity-80"
                                    }`}
                                  >
                                    <WorkflowIcon />
                                    <div
                                      className={`text-sm text-left text-nowrap transition-colors duration-200 ${
                                        getActiveTab(pair.id) === "summary"
                                          ? "text-white"
                                          : "text-[rgba(255,255,255,0.6)]"
                                      }`}
                                    >
                                      <p className="block leading-relaxed whitespace-pre">
                                        Summary
                                      </p>
                                    </div>
                                  </button>
                                )}

                              {pair.userMessage.mode === "troubleshoot" && (
                                <>
                                  <button
                                    onClick={() =>
                                      setActiveTabForPair(pair.id, "cause")
                                    }
                                    className={`box-border content-stretch flex flex-row gap-[7px] items-center justify-start p-0 relative shrink-0 transition-all duration-200 ${
                                      getActiveTab(pair.id) === "cause"
                                        ? ""
                                        : "opacity-60 hover:opacity-80"
                                    }`}
                                  >
                                    <WorkflowIcon />
                                    <div
                                      className={`text-sm text-left text-nowrap transition-colors duration-200 ${
                                        getActiveTab(pair.id) === "cause"
                                          ? "text-white"
                                          : "text-[rgba(255,255,255,0.6)]"
                                      }`}
                                    >
                                      <p className="block leading-relaxed whitespace-pre">
                                        Root Cause
                                      </p>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() =>
                                      setActiveTabForPair(pair.id, "prevention")
                                    }
                                    className={`box-border content-stretch flex flex-row gap-[7px] items-center justify-start p-0 relative shrink-0 transition-all duration-200 ${
                                      getActiveTab(pair.id) === "prevention"
                                        ? ""
                                        : "opacity-60 hover:opacity-80"
                                    }`}
                                  >
                                    <FileTextIcon />
                                    <div
                                      className={`text-sm text-left text-nowrap transition-colors duration-200 ${
                                        getActiveTab(pair.id) === "prevention"
                                          ? "text-white"
                                          : "text-[rgba(255,255,255,0.6)]"
                                      }`}
                                    >
                                      <p className="block leading-relaxed whitespace-pre">
                                        Prevention
                                      </p>
                                    </div>
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Tab underlines */}
                            <div className="absolute h-0 left-0 top-[35px] w-full">
                              <div className="absolute bottom-0 left-0 right-0 top-[-1px] w-full">
                                <svg
                                  className="block w-full h-full"
                                  fill="none"
                                  preserveAspectRatio="none"
                                  viewBox="0 0 100 1"
                                >
                                  <line
                                    stroke="#505050"
                                    x1="0"
                                    x2="100"
                                    y1="0.5"
                                    y2="0.5"
                                  />
                                </svg>
                              </div>
                            </div>

                            {/* Active tab underlines */}
                            {getActiveTab(pair.id) === "answer" && (
                              <div
                                style={getTabUnderlineStyles(
                                  pair.id,
                                  "answer",
                                  70,
                                  0
                                )}
                              >
                                <div className="absolute bottom-0 left-0 right-0 top-[-2px]">
                                  <svg
                                    className="block size-full"
                                    fill="none"
                                    preserveAspectRatio="none"
                                    viewBox="0 0 70 2"
                                  >
                                    <line
                                      stroke="#93D5DB"
                                      strokeWidth="2"
                                      x2="70"
                                      y1="1"
                                      y2="1"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                            {getActiveTab(pair.id) === "sources" &&
                              pair.assistantMessage.sources && (
                                <div
                                  style={getTabUnderlineStyles(
                                    pair.id,
                                    "sources",
                                    100,
                                    94
                                  )}
                                >
                                  <div className="absolute bottom-0 left-0 right-0 top-[-2px]">
                                    <svg
                                      className="block size-full"
                                      fill="none"
                                      preserveAspectRatio="none"
                                      viewBox="0 0 100 2"
                                    >
                                      <line
                                        stroke="#93D5DB"
                                        strokeWidth="2"
                                        x2="100"
                                        y1="1"
                                        y2="1"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            {getActiveTab(pair.id) === "steps" &&
                              pair.assistantMessage.steps && (
                                <div
                                  style={getTabUnderlineStyles(
                                    pair.id,
                                    "steps",
                                    70,
                                    pair.assistantMessage.sources ? 218 : 94
                                  )}
                                >
                                  <div className="absolute bottom-0 left-0 right-0 top-[-2px]">
                                    <svg
                                      className="block size-full"
                                      fill="none"
                                      preserveAspectRatio="none"
                                      viewBox="0 0 70 2"
                                    >
                                      <line
                                        stroke="#93D5DB"
                                        strokeWidth="2"
                                        x2="70"
                                        y1="1"
                                        y2="1"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      {/* Show loading state if no assistant message */}
                      {isStreaming &&
                        !pair.assistantMessage &&
                        pairIndex === conversationPairs.length - 1 && (
                          <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                              <span className="text-gray-400 text-sm ml-2">
                                AI is thinking...
                              </span>
                            </div>
                            <Button
                              onClick={stopStreaming}
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                            >
                              <Square className="w-3 h-3 mr-1" />
                              Stop
                            </Button>
                          </div>
                        )}

                      {/* Content Area */}
                      {pair.assistantMessage && (
                        <div className="flex-1 w-full">
                          {getActiveTab(pair.id) === "answer" && (
                            <div className="space-y-4">
                              {/* Sources Grid */}
                              {pair.assistantMessage.sources && (
                                <div className="box-border content-stretch flex flex-row gap-3 items-center justify-start p-0 relative shrink-0 w-full">
                                  {pair.assistantMessage.sources
                                    .slice(0, 4)
                                    .map((source, i) => (
                                      <div
                                        key={i}
                                        className="basis-0 bg-[#292929] grow min-h-px min-w-px relative rounded-lg shrink-0 h-20"
                                      >
                                        <div className="flex flex-col items-center relative size-full">
                                          <div className="box-border content-stretch flex flex-col gap-2 items-center justify-start p-3 relative w-full h-full">
                                            <div className="box-border content-stretch flex flex-row gap-1.5 items-center justify-start p-0 relative shrink-0 w-full">
                                              <div className="relative shrink-0 size-4">
                                                <svg
                                                  className="block size-full"
                                                  fill="none"
                                                  preserveAspectRatio="none"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <circle
                                                    cx="12"
                                                    cy="12"
                                                    fill="#D9D9D9"
                                                    r="12"
                                                  />
                                                </svg>
                                              </div>
                                              <div className="text-[#9e9e9e] text-xs text-left text-nowrap leading-relaxed">
                                                <p className="block whitespace-pre">
                                                  Source name
                                                </p>
                                              </div>
                                            </div>
                                            <div className="text-[#ffffff] text-xs text-left w-full leading-relaxed flex-1 overflow-hidden">
                                              <p className="block line-clamp-2 text-ellipsis overflow-hidden">
                                                {source.title}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}

                              {/* Raw Backend Response Debug Block */}
                              {/* <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
                                <div className="text-xs text-gray-400 mb-2 font-mono">
                                  Raw Backend Response:
                                </div>
                                <div className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                  {pair.assistantMessage.streamingContent ||
                                    pair.assistantMessage.content ||
                                    ""}
                                </div>
                              </div> */}

                              {/* Main Content with Inline Code Blocks */}
                              <div className="text-gray-200 text-lg font-light leading-relaxed w-full overflow-hidden">
                                <div className="whitespace-pre-wrap break-words">
                                  {renderMixedContent(
                                    pair.assistantMessage.streamingContent ||
                                      pair.assistantMessage.content ||
                                      "",
                                    pair.assistantMessage.id
                                  )}
                                </div>
                                {pair.assistantMessage.isStreaming && (
                                  <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse">
                                    |
                                  </span>
                                )}
                              </div>

                              {/* Legacy Code Section */}
                              {!pair.assistantMessage.isStreaming &&
                                pair.assistantMessage.code && (
                                  <CodeBlock
                                    language={
                                      pair.assistantMessage.code.language
                                    }
                                    content={pair.assistantMessage.code.content}
                                    blockId={`legacy-${pair.assistantMessage.id}`}
                                  />
                                )}
                            </div>
                          )}

                          {getActiveTab(pair.id) === "sources" &&
                            pair.assistantMessage.sources && (
                              <div className="space-y-6">
                                <h3 className="text-white text-base font-medium">
                                  Research Sources (
                                  {pair.assistantMessage.sources.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {pair.assistantMessage.sources.map(
                                    (source, index) => (
                                      <div
                                        key={index}
                                        className="bg-[#292929] rounded-lg p-4 hover:bg-[#333] transition-colors cursor-pointer"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-blue-400 text-xs">
                                            {source.type}
                                          </span>
                                          <ExternalLink className="w-3 h-3 text-gray-400" />
                                        </div>
                                        <h4 className="text-white font-medium mb-2 text-sm leading-relaxed">
                                          {source.title}
                                        </h4>
                                        <p className="text-gray-400 text-xs truncate leading-relaxed">
                                          {source.url}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Code Mode Tabs */}
                          {getActiveTab(pair.id) === "explanation" &&
                            pair.userMessage.mode === "code" && (
                              <div className="space-y-4">
                                <h3 className="text-white text-base font-medium">
                                  Code Explanation
                                </h3>
                                <div className="text-gray-300 text-sm leading-relaxed">
                                  <p>
                                    This section would contain detailed
                                    explanation of how the code works, breaking
                                    down each part and its purpose.
                                  </p>
                                </div>
                              </div>
                            )}

                          {getActiveTab(pair.id) === "tests" &&
                            pair.userMessage.mode === "code" && (
                              <div className="space-y-4">
                                <h3 className="text-white text-base font-medium">
                                  Unit Tests
                                </h3>
                                <div className="text-gray-300 text-sm leading-relaxed">
                                  <p>
                                    This section would contain unit tests for
                                    the provided code solution.
                                  </p>
                                </div>
                              </div>
                            )}

                          {/* Research Mode Tabs */}
                          {getActiveTab(pair.id) === "summary" &&
                            pair.userMessage.mode === "research" && (
                              <div className="space-y-4">
                                <h3 className="text-white text-base font-medium">
                                  Key Takeaways
                                </h3>
                                <div className="text-gray-300 text-sm leading-relaxed">
                                  <p>
                                    This section would contain a concise summary
                                    of the main points from the research.
                                  </p>
                                </div>
                              </div>
                            )}

                          {/* Troubleshoot Mode Tabs */}
                          {getActiveTab(pair.id) === "cause" &&
                            pair.userMessage.mode === "troubleshoot" && (
                              <div className="space-y-4">
                                <h3 className="text-white text-base font-medium">
                                  Root Cause Analysis
                                </h3>
                                <div className="text-gray-300 text-sm leading-relaxed">
                                  <p>
                                    This section would contain detailed analysis
                                    of what caused the issue and why it
                                    occurred.
                                  </p>
                                </div>
                              </div>
                            )}

                          {getActiveTab(pair.id) === "prevention" &&
                            pair.userMessage.mode === "troubleshoot" && (
                              <div className="space-y-4">
                                <h3 className="text-white text-base font-medium">
                                  Prevention Strategies
                                </h3>
                                <div className="text-gray-300 text-sm leading-relaxed">
                                  <p>
                                    This section would contain recommendations
                                    on how to prevent this issue from happening
                                    again.
                                  </p>
                                </div>
                              </div>
                            )}

                          {/* Action Buttons */}
                          {!pair.assistantMessage.isStreaming && (
                            <div className="box-border content-stretch flex flex-row items-start justify-between p-0 relative shrink-0 w-full pt-4 mt-4">
                              <div className="box-border content-stretch flex flex-row gap-6 items-start justify-start p-0 relative shrink-0">
                                <button
                                  onClick={() =>
                                    handleRegenerateResponse(
                                      pair.userMessage.content
                                    )
                                  }
                                  className="hover:opacity-80 transition-opacity text-gray-400 hover:text-white"
                                  title="Regenerate response"
                                >
                                  <RegenerateIcon />
                                </button>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      pair.assistantMessage.content,
                                      `content-${pair.id}`
                                    )
                                  }
                                  className="hover:opacity-80 transition-opacity relative"
                                >
                                  {copiedStates[`content-${pair.id}`] ? (
                                    <div className="text-green-400 text-xs font-medium">
                                      ✓
                                    </div>
                                  ) : (
                                    <CopyIcon />
                                  )}
                                </button>
                                <button
                                  onClick={() => console.log("Export")}
                                  className="hover:opacity-80 transition-opacity text-gray-400 hover:text-white"
                                >
                                  <ExportIcon />
                                </button>
                                <button
                                  onClick={() => console.log("Thumbs up")}
                                  className="hover:opacity-80 transition-opacity text-gray-400 hover:text-green-400"
                                >
                                  <ThumbsUpIcon />
                                </button>
                                <button
                                  onClick={() => console.log("Thumbs down")}
                                  className="hover:opacity-80 transition-opacity text-gray-400 hover:text-red-400"
                                >
                                  <ThumbsDownIcon />
                                </button>
                              </div>
                              <div className="text-[#9e9e9e] text-xs text-left text-nowrap leading-relaxed">
                                <p className="block whitespace-pre">
                                  {pair.assistantMessage.timestamp.toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`fixed bottom-0 left-72 right-0 z-40 bg-black/95 backdrop-blur-sm p-4 transition-all duration-700 ease-out ${
        isInputVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}>
        <div className="max-w-4xl mx-auto">
          {attachedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-600"
                >
                  <FileText className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-white">{file.name}</span>
                  <Button
                    onClick={() => removeAttachedFile(index)}
                    size="sm"
                    variant="ghost"
                    className="h-3 w-3 p-0 text-gray-400 hover:text-red-400"
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <div className="bg-black rounded-xl border border-gray-800 shadow-lg focus-within:ring-1 focus-within:ring-gray-700 focus-within:border-gray-700 p-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsInputVisible(true)}
                placeholder="Type your query here..."
                className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 resize-none min-h-[50px] max-h-[120px] text-sm leading-relaxed"
                style={{ height: "auto" }}
              />

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
                <div className="flex items-center gap-1 p-[2px] rounded-[12px]">
                  {chatModes.map((mode) => (
                    <Button
                      key={mode.id}
                      onClick={() => {
                        const newMode = currentMode === mode.id ? null : mode.id;
                        setPreviousMode(currentMode);
                        setCurrentMode(newMode);
                      }}
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 p-0 rounded-xl border-2 stroke-2 transition-all ${
                        currentMode === mode.id ? mode.activeColor : mode.color
                      } hover:scale-105`}
                      title={mode.label}
                    >
                      <mode.icon className="w-4 h-4 stroke-2" />
                    </Button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white p-2 rounded-xl h-8 w-8"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <VoiceRecorder
                    onTranscriptionComplete={handleVoiceTranscription}
                    onRecordingStateChange={setIsListening}
                    isRecording={isListening}
                  />
                  <Button
                    onClick={isStreaming ? stopStreaming : handleSendMessage}
                    size="sm"
                    disabled={
                      !isStreaming &&
                      !input.trim() &&
                      attachedFiles.length === 0
                    }
                    className={`px-4 py-2 rounded-xl shadow-lg h-8 text-xs ${
                      isStreaming
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-transparent hover:bg-[#90dade]/10 text-[#90dade] disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                  >
                    {isStreaming ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
