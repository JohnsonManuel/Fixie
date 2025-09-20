import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "../styles/Dashboard.css";
import ChatMessage from "../components/chat/ChatMessage";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../contexts/ThemeContext";
import { config } from "../services/config";
import { Message, Conversation } from "../types";
import { formatTimestamp, formatConversationTitle } from "../utils";
import { db } from "../services/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

// Simple icon replacements
const DeleteIcon = () => <span>🗑️</span>;
const AddIcon = () => <span>➕</span>;
const SendIcon = () => <span>📤</span>;
const MenuIcon = () => <span>☰</span>;
const LogoutIcon = () => <span>🚪</span>;
const ChatIcon = () => <span>💬</span>;

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
        console.log('ID token obtained successfully, length:', token.length);
      }).catch(error => {
        console.error('Failed to get ID token:', error);
      });
    } else {
      console.log('User not authenticated');
    }
  }, [user]);

  const view = "chat";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    if (!user) return;

    const conversationsRef = collection(db, "users", user.uid, "conversations");
    const q = query(conversationsRef, orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];
      setConversations(convos);

      // Set first conversation as active if none is selected
      if (convos.length > 0 && !activeConvoId) {
        setActiveConvoId(convos[0].id);
      }
    });

    return () => unsubscribe();
  }, [user, activeConvoId]);

  // Load messages for active conversation
  useEffect(() => {
    if (!user || !activeConvoId) return;

    const messagesRef = collection(
      db,
      "users",
      user.uid,
      "conversations",
      activeConvoId,
      "messages"
    );
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, activeConvoId]);

  // Create new conversation
  const createNewConversation = async () => {
    if (!user) return;

    const conversationsRef = collection(db, "users", user.uid, "conversations");
    const newConvoRef = await addDoc(conversationsRef, {
      title: "New Chat",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setActiveConvoId(newConvoRef.id);
    setMessages([]);
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  // Delete conversation
  const deleteConversation = async (convoId: string) => {
    if (!user) return;

    // Delete all messages in the conversation
    const messagesRef = collection(
      db,
      "users",
      user.uid,
      "conversations",
      convoId,
      "messages"
    );
    const messagesSnapshot = await getDocs(messagesRef);
    
    const batch = writeBatch(db);
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the conversation itself
    batch.delete(doc(db, "users", user.uid, "conversations", convoId));
    
    await batch.commit();

    // If this was the active conversation, switch to another one
    if (activeConvoId === convoId) {
      const remainingConversations = conversations.filter(c => c.id !== convoId);
      if (remainingConversations.length > 0) {
        setActiveConvoId(remainingConversations[0].id);
      } else {
        setActiveConvoId(null);
        setMessages([]);
      }
    }
  };

  // Send message
  const handleSendMessage = async (message: string): Promise<void> => {
    if (!user || !activeConvoId || !message.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Get fresh ID token
      const idToken = await getFreshIdToken();
      console.log('Using fresh ID token for message send');

      // Save user message to Firestore first
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
  const handleTokenError = async (error: any, retryFunction: () => Promise<void>): Promise<void> => {
    console.log('Handling token error:', error);
    
    if (error.code === 'TOKEN_EXPIRED' || error.code === 'AUTH_FAILED') {
      console.log('Token expired or auth failed, attempting to refresh...');
      
      try {
        // Force refresh the token
        await user?.getIdToken(true);
        console.log('Token refreshed successfully, retrying operation...');
        
        // Retry the original operation
        return await retryFunction();
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // If we can't refresh the token, the user needs to log in again
        throw new Error('Authentication failed. Please log in again.');
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

  // Handle interactive button clicks
  const handleButtonClick = async (buttonAction: string, messageId: string) => {
    console.log('Interactive button clicked:', buttonAction, 'for message:', messageId);
    
    // Handle different button actions
    switch (buttonAction) {
      case 'CREATE_TICKET':
        await handleSendMessage("Yes, please create a support ticket for me.");
        break;
        
      case 'CANCEL_TICKET':
        await handleSendMessage("No, I don't want to create a ticket. Let me try other solutions first.");
        break;
        
      case 'ESCALATE_ISSUE':
        await handleSendMessage("I need to escalate this issue to your support team.");
        break;
        
      case 'TRY_AGAIN':
        await handleSendMessage("Let me try the troubleshooting steps again.");
        break;
        
      case 'NEED_HELP':
        await handleSendMessage("I need additional help with this issue.");
        break;
        
      default:
        console.log('Unknown button action:', buttonAction);
        // Send the action as a message for the AI to handle
        await handleSendMessage(buttonAction);
    }
  };


  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!user) {
    return (
      <div className="dashboard">
        <div className="auth-error">
          <h2>Authentication Error</h2>
          <p>You must be logged in to access the dashboard.</p>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-btn" onClick={toggleSidebar}>
            <MenuIcon />
          </button>
          <h1>Fixie AI Support</h1>
        </div>
        <div className="header-right">
          <ThemeToggle />
          <button className="logout-btn" onClick={logout}>
            <LogoutIcon />
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h2>Conversations</h2>
            <button className="new-chat-btn" onClick={createNewConversation}>
              <AddIcon />
              New Chat
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
                  setIsSidebarOpen(false); // Close sidebar on mobile
                }}
              >
                <div className="conversation-content">
                  <div className="conversation-title">
                    {formatConversationTitle(convo.title || "New Chat", activeConvoId === convo.id)}
                  </div>
                  <div className="conversation-meta">
                    {formatTimestamp(convo.updatedAt)}
                  </div>
                </div>
                <button
                  className="delete-conversation-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(convo.id);
                  }}
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="main-content">
          {view === "chat" && (
            <div className="chat-view">
              {!activeConvoId ? (
                <div className="no-conversation">
                  <div className="no-conversation-content">
                    <ChatIcon />
                    <h2>Welcome to Fixie AI Support</h2>
                    <p>Start a new conversation to get help with your IT issues.</p>
                    <button className="start-chat-btn" onClick={createNewConversation}>
                      <AddIcon />
                      Start New Chat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="chat-container">
                  <div className="chat-header">
                    <h3>
                      {conversations.find(c => c.id === activeConvoId)?.title || "Chat"}
                    </h3>
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
                              onButtonClick={handleButtonClick}
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
                            disabled={!inputMessage.trim() || isLoading}
                            className="send-btn"
                          >
                            <SendIcon />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/** Main Dashboard Component with Theme Provider */
export default function Dashboard() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}