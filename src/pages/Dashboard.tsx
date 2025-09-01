import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "../styles/Dashboard.css";
import ChatMessage from "../components/chat/ChatMessage";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../contexts/ThemeContext";
import { config } from "../services/config";
import { Message, Conversation } from "../types";
import { formatTimestamp, formatConversationTitle } from "../utils";
import { 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  Send as SendIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Chat as ChatIcon
} from '@mui/icons-material';

// Firebase client
import { db } from "../services/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

/** Use the new separated function endpoints from config */
const CHAT_ENDPOINT = config.functions.chat;

/** Enhanced Dashboard with Chat Interface */
function DashboardContent() {
  const { user, logout } = useAuth();

  // Add authentication state check
  useEffect(() => {
    if (user) {
      console.log('User authenticated:', { 
        uid: user.uid, 
        email: user.email,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous
      });
      
      // Check if user has a valid ID token
      user.getIdToken(true).then(token => {
        console.log('Initial ID token check successful, length:', token.length);
      }).catch(error => {
        console.error('Initial ID token check failed:', error);
      });
    } else {
      console.log('No user authenticated');
    }
  }, [user]);

  const [view, setView] = useState<"chat">("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to user's conversations (latest first)
  useEffect(() => {
    if (!user?.uid) return;
    const convosRef = collection(db, "users", user.uid, "conversations");
    const qConvos = query(convosRef, orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(qConvos, (snap) => {
      const list: Conversation[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setConversations(list);

      if (!activeConvoId && list.length) setActiveConvoId(list[0].id);
      if (activeConvoId && !list.find((c) => c.id === activeConvoId)) {
        setActiveConvoId(list[0]?.id ?? null);
      }
    });

    return unsub;
  }, [user, activeConvoId]);

  // Subscribe to active conversation's messages
  useEffect(() => {
    if (!user?.uid || !activeConvoId) return;
    const messagesRef = collection(
      db,
      "users",
      user.uid,
      "conversations",
      activeConvoId,
      "messages"
    );
    const qMessages = query(messagesRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(qMessages, (snap) => {
      const list: Message[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setMessages(list);
    });

    return unsub;
  }, [user, activeConvoId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewConversation = async () => {
    if (!user?.uid) return;
    const convosRef = collection(db, "users", user.uid, "conversations");
    const newConvo = await addDoc(convosRef, {
      title: "Start a new conversation...",
      updatedAt: serverTimestamp(),
      lastMessage: "",
      model: "gpt-4",
    });
    setActiveConvoId(newConvo.id);
  };

  const deleteConversation = async (convoId: string) => {
    if (!user?.uid) return;
    
    try {
      // Delete all messages first
      const messagesRef = collection(
        db,
        "users",
        user.uid,
        "conversations",
        convoId,
        "messages"
      );
      const messagesSnap = await getDocs(messagesRef);
      const batch = writeBatch(db);
      messagesSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Delete conversation
      await deleteDoc(doc(db, "users", user.uid, "conversations", convoId));
      
      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== convoId));
      if (activeConvoId === convoId) {
        setActiveConvoId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleSendMessage = async (message: string): Promise<void> => {
    if (!user?.uid || !activeConvoId || !message.trim()) {
      console.error('Missing required data:', { 
        hasUser: !!user, 
        hasUid: !!user?.uid, 
        hasActiveConvo: !!activeConvoId, 
        hasMessage: !!message.trim() 
      });
      return;
    }

    console.log('Sending message:', message, 'to conversation:', activeConvoId);
    setIsLoading(true);
    
    try {
      // Get fresh ID token with retry logic
      let idToken;
      try {
        idToken = await getFreshIdToken();
        console.log('ID token obtained successfully, length:', idToken.length);
      } catch (tokenError) {
        console.error('Error getting ID token:', tokenError);
        throw new Error('Failed to get authentication token. Please try logging in again.');
      }

      // Add user message to Firestore
      const messagesRef = collection(
        db,
        "users",
        user.uid,
        "conversations",
        activeConvoId,
        "messages"
      );
      await addDoc(messagesRef, {
        role: "user",
        content: message,
        createdAt: serverTimestamp(),
      });
      console.log('User message saved to Firestore');

      // Send to your Firebase function for AI response
      console.log('Calling Firebase function at:', CHAT_ENDPOINT);
      const requestBody = {
        idToken: idToken,
        conversationId: activeConvoId,
        message: message,
      };
      console.log('Request body prepared:', { 
        hasIdToken: !!requestBody.idToken, 
        conversationId: requestBody.conversationId,
        messageLength: requestBody.message.length 
      });

      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('AI response received successfully:', result);
        
        // The AI response will be added by the Firebase function
        // We can also display additional info if needed
        if (result.supportStage) {
          console.log('Support stage:', result.supportStage);
        }
        if (result.ticketDetails) {
          console.log('Ticket details:', result.ticketDetails);
        }
      } else {
        const errorText = await response.text();
        console.error('Firebase function error:', response.status, errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { details: errorText };
        }
        
        // Check if it's a token error and handle accordingly
        if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'AUTH_FAILED') {
          return await handleTokenError(errorData, () => handleSendMessage(message));
        }
        
        throw new Error(`Failed to get AI response: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const messagesRef = collection(
        db,
        "users",
        user.uid,
        "conversations",
        activeConvoId,
        "messages"
      );
      await addDoc(messagesRef, {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        createdAt: serverTimestamp(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get a fresh ID token with retry logic
  const getFreshIdToken = async (retries = 3): Promise<string> => {
    try {
      // Force refresh the token
      const token = await user?.getIdToken(true);
      if (!token) {
        throw new Error('Failed to get ID token');
      }
      return token;
    } catch (error) {
      if (retries > 0) {
        console.log(`Token refresh failed, retrying... (${retries} attempts left)`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getFreshIdToken(retries - 1);
      }
      throw new Error('Failed to get fresh ID token after multiple attempts');
    }
  };

  // Check if token is expired and handle accordingly
  const handleTokenError = async (error: any, retryFunction: () => Promise<any>): Promise<any> => {
    if (error?.details?.includes('TOKEN_EXPIRED') || 
        error?.details?.includes('auth/id-token-expired') ||
        error?.details?.includes('Firebase ID token has expired')) {
      
      console.log('Token expired, attempting to refresh...');
      
      try {
        // Force refresh the token
        await user?.getIdToken(true);
        console.log('Token refreshed successfully, retrying operation...');
        
        // Retry the original operation
        return await retryFunction();
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // If refresh fails, redirect to login
        alert('Your session has expired. Please log in again.');
        logout();
        return null;
      }
    }
    
    // If it's not a token error, re-throw
    throw error;
  };

  // Handle action button clicks
  const handleAction = async (action: any) => {
    console.log('Action clicked:', action);
    
    // Handle basic chat actions
    if (action.type === 'cancel_ticket') {
      // Send cancellation message
      await handleSendMessage("No, I don't want a ticket created. Let me try something else.");
    } else if (action.type === 'suggest_ticket') {
      // Send a message to prompt ticket creation
      await handleSendMessage("I think I need to create a support ticket for this issue. Can you help me with that?");
    }
  };





  // Handle view change and close sidebar on mobile
  const handleViewChange = (newView: "chat") => {
    setView(newView);
    setIsSidebarOpen(false); // Close sidebar on mobile when switching views
  };

  return (
    <div className="dashboard">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            {/* Mobile menu button */}
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle menu"
            >
              <MenuIcon />
            </button>
            <div className="logo">
              <span className="logo-text">Fixie</span>
            </div>
          </div>
          <div className="nav-center">
            <button 
              className={`nav-btn ${view === 'chat' ? 'active' : ''}`}
              onClick={() => handleViewChange('chat')}
            >
              Chat
            </button>
          </div>
          <div className="nav-right">
            <span className="user-email">{user?.email}</span>
            <button onClick={logout} className="logout-btn">
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-container">
        <div className="chat-view">
          {/* Mobile backdrop overlay */}
          {isSidebarOpen && (
            <div 
              className="sidebar-backdrop"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="sidebar-header">
              <button onClick={createNewConversation} className="new-chat-btn">
                <AddIcon />
                + New Chat
              </button>
            </div>
            <div className="conversations-list">
              {conversations.map((convo) => (
                <div
                  key={convo.id}
                  className={`conversation-item ${
                    activeConvoId === convo.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveConvoId(convo.id);
                    setIsSidebarOpen(false); // Close sidebar on mobile when selecting conversation
                  }}
                >
                  <div className="conversation-title">
                    {formatConversationTitle(convo.title || "New Conversation", activeConvoId === convo.id)}
                  </div>
                  <div className="conversation-preview">
                    {convo.lastMessage || "Start a new conversation..."}
                  </div>
                  <div className="conversation-meta">
                    {convo.updatedAt && (
                      <span className="conversation-date">
                        {formatTimestamp(convo.updatedAt)}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(convo.id);
                      }}
                      className="delete-conversation-btn"
                      title="Delete conversation"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="sidebar-footer">
              <div className="theme-toggle-container">
                <span className="theme-label">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="chat-interface">
            {activeConvoId ? (
              <div className="chat-container">
                <div className="chat-messages">
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      onAction={handleAction}
                    />
                  ))}
                  {isLoading && (
                    <div className="message assistant">
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
                
                {/* Removed Jira project selector */}

                <div className="chat-input">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (inputMessage.trim() && !isLoading) {
                          handleSendMessage(inputMessage);
                          setInputMessage("");
                        }
                      }
                    }}
                    placeholder="Type your message..."
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => {
                      if (inputMessage.trim() && !isLoading) {
                        handleSendMessage(inputMessage);
                        setInputMessage("");
                      }
                    }}
                    disabled={isLoading || !inputMessage.trim()}
                    className="send-btn"
                  >
                    <SendIcon />
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-conversation">
                <h2>Welcome to Fixie!</h2>
                <p>Start a new conversation to get help with your IT issues. The AI will automatically generate descriptive titles for your conversations.</p>
                <button onClick={createNewConversation} className="new-chat-btn">
                  <ChatIcon />
                  Start New Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}

export default Dashboard;
