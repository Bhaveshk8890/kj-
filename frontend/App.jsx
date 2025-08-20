import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ChatInterface from './components/ChatInterface';
import Analytics from './components/Analytics';
import Agents from './components/Agents';
import { Sidebar } from './components/Sidebar';
import { ChatProvider } from './components/ChatContext';
import { AuthService } from './services/auth';
import { indexedDBService } from './services/indexedDB';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check for existing authentication on app load
  useEffect(() => {
    const initApp = async () => {
      await indexedDBService.init();
      
      if (AuthService.isAuthenticated()) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setIsAuthenticated(true);
          setUser(JSON.parse(storedUser));
        }
      }
    };
    
    initApp();
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="dark bg-background text-foreground">
        <ChatProvider>
          {/* Fixed Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-72">
            <Sidebar user={user} onLogout={handleLogout} />
          </div>
          
          {/* Main Content with left margin to account for fixed sidebar */}
          <main className="ml-72 min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/chat/:sessionId" element={<ChatInterface />} />
              <Route path="/insights" element={<Analytics user={user} />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </main>
        </ChatProvider>
      </div>
    </Router>
  );
}


