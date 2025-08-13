import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { config } from './config';
import './Dashboard.css';
import TicketsPage from './Tickets';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}


function Dashboard() {
  const { user, logout } = useAuth();

  /** view controls what shows on the right side */
  type View = 'chat' | 'tickets';
  const [view, setView] = useState<View>('chat');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (!config.openaiApiKey) {
        throw new Error('OpenAI API key not configured. Please check your environment variables.');
      }
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are JJ.AI, an AI-powered IT support assistant. You help users resolve technical issues, provide guidance on IT problems, and offer solutions for common computer and network issues. Be helpful, professional, and concise in your responses. Focus on practical IT solutions and troubleshooting steps.'
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userMessage.content
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API configuration or try again later.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setView('chat'); // ensure right side shows Chat
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUsername = () => {
    if (!user?.email) return 'User';
    return user.email.split('@')[0];
  };

  return (
    <div className="dashboard chat-started">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-content">
          <button onClick={handleNewChat} className={`sidebar-item new-chat ${view === 'chat' ? 'active' : ''}`}>
            <span className="icon icon-badge">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </span>
            <span className="label">New chat</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${view === 'tickets' ? 'active' : ''}`}
            onClick={() => setView('tickets')}
            aria-current={view === 'tickets' ? 'page' : undefined}
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
                <path d="M4 7h12a2 2 0 0 1 2 2v1a2 2 0 1 0 0 4v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a2 2 0 1 0 0-4V9a2 2 0 0 1 2-2z" />
              </svg>
            </span>
            <span className="label">Tickets</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content"></div>
          <div className="user-menu">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </header>

        {/* Right side switches between Chat and Tickets */}
        {view === 'chat' ? (
          <div className="chat-area">
            {/* Welcome */}
            {messages.length === 0 && (
              <div className="welcome-screen visible">
                <div className="welcome-content">
                  <div className="welcome-icon">✨</div>
                  <h1 className="welcome-title">Welcome, {getUsername()}</h1>
                  <form onSubmit={handleSendMessage} className="message-form compact-form">
                    <div className="input-wrapper compact-input-wrapper">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="How can I help you today?"
                        className="message-input"
                        disabled={isLoading}
                      />
                      <div className="input-right-section">
                        <button
                          type="submit"
                          className="send-button"
                          disabled={isLoading || !inputMessage.trim()}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="send-icon">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="messages-container">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-avatar">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{message.content}</div>
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message assistant-message">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input (bottom) */}
            {messages.length > 0 && (
              <div className="input-container">
                <form onSubmit={handleSendMessage} className="message-form">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="How can I help you today?"
                      className="message-input"
                      disabled={isLoading}
                    />
                    <div className="input-right-section">
                      <button
                        type="submit"
                        className="send-button"
                        disabled={isLoading || !inputMessage.trim()}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="send-icon">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </form>
                <div className="input-footer">
                  <div className="tool-status">
                    <div className="status-dot green"></div>
                    <div className="status-dot orange"></div>
                    <div className="status-dot blue"></div>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="chevron-right">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <TicketsPage />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
