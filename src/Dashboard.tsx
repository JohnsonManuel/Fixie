import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import "./Dashboard.css";
import Settings from "./Settings";
import ChatMessage from "./components/ChatMessage";
import { config } from "./config";

// Firebase client
import { db } from "./firebase";
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

type Role = "user" | "assistant" | "system";

interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt?: any; // Firestore Timestamp | Date
  actions?: any[]; // For tool calling actions
}

type Conversation = {
  id: string;
  title?: string;
  updatedAt?: any;
  lastMessage?: string;
  model?: string;
};

/** Use the new separated function endpoints from config */
const CHAT_ENDPOINT = config.functions.chat;

/** Enhanced Dashboard with Chat Interface */
function Dashboard() {
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

  const [view, setView] = useState<"chat" | "tickets" | "settings">("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add these state variables at the top with other useState declarations
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');

  // Add debug function to test ID token
  const testIdToken = async () => {
    if (!user) {
      console.error('No user available');
      return;
    }
    
    try {
      console.log('Testing ID token...');
      const token = await user.getIdToken(true);
      console.log('ID token obtained:', {
        length: token.length,
        firstChars: token.substring(0, 20) + '...',
        lastChars: '...' + token.substring(token.length - 20)
      });
      
      // Test the token with a simple request
      const testResponse = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: token,
          conversationId: activeConvoId || 'test',
          message: 'test message',
        }),
      });
      
      console.log('Test request response:', testResponse.status, testResponse.statusText);
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('Test request error:', errorText);
      } else {
        console.log('Test request successful');
      }
    } catch (error) {
      console.error('Error testing ID token:', error);
    }
  };

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
    setDeletingId(convoId);
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
    } catch (error) {
      console.error("Error deleting conversation:", error);
    } finally {
      setDeletingId(null);
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
        
        // NEW: Check if tool action is needed
        if (result.requiresTool) {
          console.log('Tool action required:', result.toolType);
          // Call tool orchestrator to determine next steps
          await handleToolAction(result.toolType, result.ticketDetails);
        }
        
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

  // Handle tool actions - coordinates with tool orchestrator
  const handleToolAction = async (toolType: string, toolData: any) => {
    try {
      if (!user?.uid || !activeConvoId) {
        console.error('Missing user or conversation ID');
        return;
      }

      const idToken = await getFreshIdToken();
      
      // Call tool orchestrator to determine next steps
      const response = await fetch(config.functions.toolOrchestrator, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          action: 'escalate_to_ticket',
          conversationId: activeConvoId,
          toolType,
          toolData
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Tool orchestrator response:', result);
        
        // Handle different actions returned by orchestrator
        switch (result.action) {
          case 'connect_jira':
            handleJiraOAuth();
            break;
          case 'select_project':
            setShowProjectSelector(true);
            setAvailableProjects(result.data.projects || []);
            break;
          case 'create_ticket':
            await createJiraTicket(result.data);
            break;
          default:
            console.log('Unknown action from orchestrator:', result.action);
        }
      } else {
        const errorText = await response.text();
        console.error('Tool orchestrator error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error handling tool action:', error);
    }
  };

  // Create Jira ticket using Jira operations function
  const createJiraTicket = async (ticketData: any) => {
    try {
      if (!user?.uid || !activeConvoId) {
        console.error('Missing user or conversation ID');
        return;
      }

      const idToken = await user.getIdToken(true);
      
      const response = await fetch(config.functions.jiraOperations, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          action: 'create_ticket',
          conversationId: activeConvoId,
          ticketDetails: ticketData.ticketDetails
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Ticket created successfully:', result.ticketId);
        // Real-time updates will show the ticket creation message
      } else {
        const errorText = await response.text();
        console.error('Error creating ticket:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  // Handle Jira OAuth connection
  const handleJiraOAuth = async () => {
    try {
      if (!user?.uid || !activeConvoId) {
        console.error('Missing user or conversation ID');
        return;
      }

      // Get fresh ID token
      const idToken = await user.getIdToken(true);
      
      // Open Jira OAuth in new window
      const oauthUrl = `${config.functions.jiraOAuth}?idToken=${idToken}&conversationId=${activeConvoId}`;
      const oauthWindow = window.open(oauthUrl, 'jira_oauth', 'width=600,height=700');
      
      if (!oauthWindow) {
        alert('Please allow popups to connect to Jira');
        return;
      }

      // Listen for OAuth completion
      const handleMessage = (event: MessageEvent) => {
        const oauthOrigin = new URL(config.functions.jiraOAuth).origin;
        if (event.origin !== oauthOrigin) {
          return; // Security check
        }
        
        if (event.data.type === 'jira_connected' && event.data.success) {
          console.log('Jira connected successfully');
          oauthWindow.close();
          
          // Refresh the page to show connected status
          window.location.reload();
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Clean up listener after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        if (!oauthWindow.closed) {
          oauthWindow.close();
        }
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('Error connecting to Jira:', error);
      alert('Failed to connect to Jira. Please try again.');
    }
  };

  // Handle action button clicks
  const handleAction = async (action: any) => {
    console.log('Action clicked:', action);
    
    if (action.type === 'connect_jira') {
      handleJiraOAuth();
    } else if (action.type === 'confirm_ticket') {
      // Call tool orchestrator to create ticket
      await handleToolAction('ticket_creation', { confirmed: true, ticketDetails: action.data?.ticketDetails });
    } else if (action.type === 'cancel_ticket') {
      // Send cancellation message
      await handleSendMessage("No, I don't want a ticket created. Let me try something else.");
    } else if (action.type === 'suggest_ticket') {
      // Send a message to prompt ticket creation
      await handleSendMessage("I think I need to create a support ticket for this issue. Can you help me with that?");
    } else if (action.type === 'select_project') {
      setShowProjectSelector(true);
      setAvailableProjects(action.data.projects || []);
    }
  };

  // Add this function to handle project selection
  const handleProjectSelection = async (projectName: string) => {
    try {
      if (!user?.uid || !activeConvoId) {
        console.error('Missing user or conversation ID');
        return;
      }

      const idToken = await getFreshIdToken();
      
      // Call Jira operations function directly
      const response = await fetch(config.functions.jiraOperations, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          action: 'select_project',
          conversationId: activeConvoId,
          projectName
        }),
      });
      
      if (response.ok) {
        console.log('Project selected successfully');
        setShowProjectSelector(false);
        setSelectedProject('');
        // No need to reload page - real-time updates will handle this
      } else {
        const errorText = await response.text();
        console.error('Error selecting project:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error selecting project:', error);
    }
  };

  const handleBackToDashboard = () => {
    setView('chat');
  };

  // Format conversation title for display
  const formatConversationTitle = (title: string, isActive: boolean) => {
    if (!title || title === "Start a new conversation...") {
      return isActive ? "Start typing..." : "New Conversation";
    }
    
    // Truncate long titles
    if (title.length > 40) {
      return title.substring(0, 37) + "...";
    }
    
    return title;
  };

  // Handle view change and close sidebar on mobile
  const handleViewChange = (newView: "chat" | "tickets" | "settings") => {
    setView(newView);
    setIsSidebarOpen(false); // Close sidebar on mobile when switching views
  };



  // Show settings page
  if (view === 'settings') {
    return <Settings onBackToDashboard={handleBackToDashboard} />;
  }

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
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
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
            <button 
              className={`nav-btn ${view === 'tickets' ? 'active' : ''}`}
              onClick={() => handleViewChange('tickets')}
            >
              Tickets
            </button>
            <button 
              className={`nav-btn ${(view as string) === 'settings' ? 'active' : ''}`}
              onClick={() => handleViewChange('settings')}
            >
              Settings
            </button>
          </div>
          <div className="nav-right">
            <span className="user-email">{user?.email}</span>
            <button onClick={testIdToken} className="debug-btn" title="Test ID Token">
              🔍 Debug Token
            </button>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-container">
        {view === "chat" && (
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
                      {convo.lastMessage || "No messages yet"}
                    </div>
                    <button
                      className="delete-conversation-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(convo.id);
                      }}
                      disabled={deletingId === convo.id}
                    >
                      {deletingId === convo.id ? "..." : "×"}
                    </button>
                  </div>
                ))}
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
                  
                  {showProjectSelector && (
                    <div className="project-selector-overlay">
                      <div className="project-selector-modal">
                        <h3>Select Jira Project</h3>
                        <p>Choose which project to use for ticket creation:</p>
                        <select 
                          value={selectedProject} 
                          onChange={(e) => setSelectedProject(e.target.value)}
                          className="project-dropdown"
                        >
                          <option value="">Select a project...</option>
                          {availableProjects.map((project, index) => (
                            <option key={index} value={project.name}>
                              {project.name} {project.current ? '(Current)' : ''}
                            </option>
                          ))}
                        </select>
                        <div className="project-selector-actions">
                          <button 
                            onClick={() => handleProjectSelection(selectedProject)}
                            disabled={!selectedProject}
                            className="select-project-btn"
                          >
                            Select Project
                          </button>
                          <button 
                            onClick={() => {
                              setShowProjectSelector(false);
                              setSelectedProject('');
                            }}
                            className="cancel-project-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

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
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-conversation">
                  <h2>Welcome to Fixie!</h2>
                  <p>Start a new conversation to get help with your IT issues. The AI will automatically generate descriptive titles for your conversations.</p>
                  <button onClick={createNewConversation} className="new-chat-btn">
                    Start New Chat
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "tickets" && (
          <div className="tickets-view">
            <div className="tickets-header">
              <h2>Support Tickets</h2>
              <p>Manage and track your support requests</p>
            </div>
            <div className="tickets-content">
              <div className="no-tickets">
                <h3>No tickets yet</h3>
                <p>Connect your ticketing platform in Settings to start creating tickets automatically.</p>
                <button onClick={() => setView('settings')} className="btn-primary">
                  Go to Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
