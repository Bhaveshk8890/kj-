import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useChatContext } from './ChatContext';
import { 
  MessageSquare, 
  BarChart3, 
  Bot, 
  Plus, 
  MoreVertical,
  LogOut,
  Clock,
  Trash2,
  Sparkles,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';

export function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams();
  const { state, createNewSession, deleteSession } = useChatContext();
  const currentSessionId = urlSessionId || state.currentSessionId;
  const [searchQuery, setSearchQuery] = useState('');

  const navigationItems = [
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: BarChart3, label: 'Insights', path: '/insights' },
    { icon: Bot, label: 'Agents', path: '/agents' },
  ];

  const handleDeleteSession = (sessionId, event) => {
    event.preventDefault();
    event.stopPropagation();
    deleteSession(sessionId);
    
    // If we're deleting the current session, navigate to main chat
    if (currentSessionId === sessionId) {
      navigate('/chat');
    }
  };

  const handleCreateNewSession = () => {
    const newSessionId = createNewSession('research');
    navigate(`/chat/${newSessionId}`);
  };

  const isSessionActive = (sessionId) => {
    return currentSessionId === sessionId;
  };

  const isChatActive = () => {
    return location.pathname.startsWith('/chat');
  };

  const handleMenuAction = (action) => {
    switch (action) {
      case 'documentation':
        console.log('Opening documentation...');
        // In real implementation, this would open documentation
        alert('Documentation would open here');
        break;
      case 'user-guide':
        console.log('Opening user guide...');
        // In real implementation, this would open user guide
        alert('User guide would open here');
        break;
      case 'logout':
        onLogout();
        break;
    }
  };

  return (
    <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-screen relative">
      {/* App Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-medium text-sidebar-foreground">AI Assistant</h2>
            <p className="text-sm text-sidebar-foreground/70">Internal Tool</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = item.path === '/chat' ? isChatActive() : location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start font-medium ${
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Chat Sessions */}
      <div className="flex-1 flex flex-col min-h-0 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sidebar-foreground text-sm">Recent Chats</h3>
          <Button
            onClick={handleCreateNewSession}
            size="sm"
            variant="ghost"
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent p-1.5 h-7 w-7"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="mb-3 relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="h-8 text-xs bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 pr-8"
          />
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery('')}
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto space-y-3 pr-1">
            {state.sessions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-sidebar-foreground/60">No chat history yet</p>
                <p className="text-xs text-sidebar-foreground/40 mt-1">Start a conversation</p>
              </div>
            ) : (
              state.sessions
                .filter(session => 
                  session.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((session) => {
                const isActive = isSessionActive(session.id);
                return (
                  <Link key={session.id} to={`/chat/${session.id}`}>
                    <div
                      className={`group p-2.5 rounded-md cursor-pointer transition-colors ${
                        isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                          : 'hover:bg-sidebar-accent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate leading-tight ${
                            isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground'
                          }`}>
                            {session.title}
                          </p>
                          <p className={`text-xs flex items-center mt-1 ${
                            isActive ? 'text-sidebar-accent-foreground/70' : 'text-sidebar-foreground/60'
                          }`}>
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {session.timestamp}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <Button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            size="sm"
                            variant="ghost"
                            className="text-sidebar-foreground/50 hover:text-red-500 p-0.5 h-5 w-5"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* User Profile at Bottom */}
      <div className="p-2 relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer group">
              <div className="flex items-center space-x-3 min-w-0">
                <Avatar className="w-10 h-10 border-2 border-sidebar-border flex-shrink-0">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-sidebar-foreground truncate text-sm">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {user?.department || 'Engineering'}
                  </p>
                </div>
              </div>
              <MoreVertical className="w-4 h-4 text-sidebar-foreground/50 flex-shrink-0 group-hover:text-sidebar-foreground transition-colors" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            side="top"
            className="w-72 mb-2"
            sideOffset={8}
          >
            <DropdownMenuItem 
              onClick={() => handleMenuAction('documentation')}
              className="cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-3" />
              <span>Documentation</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleMenuAction('user-guide')}
              className="cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 mr-3" />
              <span>User Guide</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleMenuAction('logout')}
              variant="destructive"
              className="cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-2 text-xs text-sidebar-foreground/60">
          <Sparkles className="w-4 h-4" />
          <span>Internal AI Assistant v1.0</span>
        </div>
      </div>
    </div>
  );
}