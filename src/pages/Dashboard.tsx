import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import "../styles/Dashboard.css";
import ChatMessage from "../components/chat/ChatMessage";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../contexts/ThemeContext";
import { config } from "../services/config";
import { Message, Conversation } from "../types";
import { formatTimestamp, formatConversationTitle } from "../utils";
import { db } from "../services/firebase"; // Kept for Organization logic
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  writeBatch,
  where
} from "firebase/firestore";

// =============================================================================
// CONFIG & ICONS
// =============================================================================

// Adjust this to match your Cloud Run URL (without trailing slash)
const API_BASE_URL = config.functions.chat.replace('/chat', '') ;

const DeleteIcon = () => <span>🗑️</span>;
const AddIcon = () => <span>➕</span>;
const SendIcon = () => <span>📤</span>;
const MenuIcon = () => <span>☰</span>;
const LogoutIcon = () => <span>🚪</span>;
const ChatIcon = () => <span>💬</span>;

// =============================================================================
// COMPONENT
// =============================================================================

type DashboardContentProps = {
  userRole: string | null;
  organizationKey: string | null;
};

function DashboardContent({ userRole, organizationKey }: DashboardContentProps) {
  const { user, logout } = useAuth();
  
  // UI State
  const [activeTab, setActiveTab] = useState<"chat" | "organization">("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat State (Now driven by Python API)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Organization State (Driven by Firestore - Unchanged)
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgDomain, setOrgDomain] = useState("");

  // ===========================================================================
  // HELPER: API FETCH WITH AUTH
  // ===========================================================================
  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!user) throw new Error("User not authenticated");
    const token = await user.getIdToken();
    
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {}),
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok && endpoint !== "/chat/stream") { // Stream handles errors differently
       const err = await res.text();
       throw new Error(err || res.statusText);
    }
    return res;
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // ===========================================================================
  // 1. LOAD THREADS (GET /threads)
  // ===========================================================================
  const loadThreads = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth("/threads");
      const data = await res.json();
      
      // Map Python ThreadInfo to UI Conversation
      const mapped: Conversation[] = data.threads.map((t: any) => ({
        id: t.thread_id,
        title: t.metadata?.title || "New Chat",
        // Handle generic date string to JS Date object for utils
        updatedAt: t.updated_at ? new Date(t.updated_at) : new Date(),
        createdAt: t.created_at ? new Date(t.created_at) : new Date(),
      }));

      setConversations(mapped);
      
      // If we have threads but none selected, select the first one
      if (mapped.length > 0 && !activeConvoId) {
        setActiveConvoId(mapped[0].id);
      }
    } catch (error) {
      console.error("Failed to load threads", error);
    }
  }, [user, activeConvoId, fetchWithAuth]);

  useEffect(() => {
    if (activeTab === "chat") loadThreads();
  }, [activeTab, loadThreads]);

  // ===========================================================================
  // 2. LOAD HISTORY (GET /threads/{id}/history)
  // ===========================================================================
  useEffect(() => {
    if (!user || !activeConvoId) return;

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const res = await fetchWithAuth(`/threads/${activeConvoId}/history`);
        const data = await res.json();

        // Map LangGraph messages to UI Messages
        const uiMessages: Message[] = (data.messages || []).map((m: any, index: number) => ({
          id: m.id || `msg-${index}`, // Fallback ID
          role: m.type === "human" ? "user" : "assistant",
          content: m.content,
          createdAt: new Date(), // History doesn't always have exact timestamp per msg
        }));
        
        setMessages(uiMessages);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [user, activeConvoId, fetchWithAuth]);

  // ===========================================================================
  // 3. CREATE THREAD (POST /threads)
  // ===========================================================================
  const createNewConversation = async () => {
    try {
      const res = await fetchWithAuth("/threads", { method: "POST" });
      const data = await res.json(); // returns { thread_id: "..." }
      
      const newConvo: Conversation = {
        id: data.thread_id,
        title: "New Chat",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setConversations([newConvo, ...conversations]);
      setActiveConvoId(data.thread_id);
      setMessages([]);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error("Error creating thread", error);
    }
  };

  // ===========================================================================
  // 4. DELETE THREAD (DELETE /threads/{id})
  // ===========================================================================
  const deleteConversation = async (convoId: string) => {
    try {
      await fetchWithAuth(`/threads/${convoId}`, { method: "DELETE" });
      
      const remaining = conversations.filter((c) => c.id !== convoId);
      setConversations(remaining);
      
      if (activeConvoId === convoId) {
        setActiveConvoId(remaining[0]?.id || null);
        if (!remaining.length) setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting thread", error);
    }
  };

  // ===========================================================================
  // 5. STREAM CHAT (POST /chat/stream)
  // ===========================================================================
  const handleSendMessage = async (text: string): Promise<void> => {
    if (!user || !activeConvoId || !text.trim() || isLoading) return;

    setIsLoading(true);
    setIsStreaming(true);

    // 1. Optimistic Update (Show user message immediately)
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // 2. Prepare AI Message Placeholder
    const tempAiMsgId = "temp-ai-" + Date.now();
    const tempAiMsg: Message = {
      id: tempAiMsgId,
      role: "assistant",
      content: "", // Starts empty
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempAiMsg]);

    try {
      // 3. Call API
      const res = await fetchWithAuth("/chat/stream", {
        method: "POST",
        body: JSON.stringify({
          thread_id: activeConvoId,
          input: { messages: [{ role: "user", content: text }] } 
        }),
      });

      if (!res.body) throw new Error("No stream body");

      // 4. Read Stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === "done") break;

            // Logic to extract content from LangGraph event
            let token = "";
            
            // Case A: Standard content field
            if (data.content) token = data.content;
            // Case B: Deeply nested message update (LangGraph specific)
            else if (data.messages && Array.isArray(data.messages)) {
                const lastMsg = data.messages[data.messages.length - 1];
                if (lastMsg.type === 'ai') {
                   // If the backend sends the FULL message every time, replace it.
                   // If it sends deltas, append it. 
                   // Based on your Python code returning chunk.data, 
                   // let's assume it might be returning full state updates or deltas.
                   // For safety in this UI, let's assume we need to grab content length diff or just update:
                   if (lastMsg.content.length >= aiContent.length) {
                       token = lastMsg.content.substring(aiContent.length); 
                   }
                }
            }

            if (token) {
              aiContent += token;
              
              // Update the specific message in state
              setMessages((prev) => 
                prev.map((msg) => 
                  msg.id === tempAiMsgId ? { ...msg, content: aiContent } : msg
                )
              );
            }
          } catch (e) {
            console.warn("Stream parse error", line);
          }
        }
      }
    } catch (error) {
      console.error("Streaming error", error);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === tempAiMsgId ? { ...msg, content: "Error: Could not get response." } : msg
        )
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // ===========================================================================
  // ORGANIZATION LOGIC (Kept exactly as is, using Firestore)
  // ===========================================================================
  
  useEffect(() => {
    if (!user) return;
    // Keeping original Firestore listener for Organizations
    const orgsRef = collection(db, "organizations");
    const q = query(orgsRef, where("createdBy", "==", user.email));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orgList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrganizations(orgList);
    });

    return () => unsubscribe();
  }, [user]);

  const deleteOrganization = (orgId: string) => {
     // Implementation for deleting org (if needed per original code)
     console.log("Delete org", orgId);
  };

  const createOrganization = async () => {
    if (!user) return;

    if (!organizationKey) {
      alert("No organization key found for this admin.");
      return;
    }

    let raw = orgDomain.trim().toLowerCase();
    if (!raw) {
      alert("Enter a valid domain name");
      return;
    }

    // allow "@fixie.com" -> "fixie.com"
    raw = raw.replace(/^@/, "");

    // basic domain syntax check
    const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
    if (!DOMAIN_PATTERN.test(raw)) {
      alert("Domain must be in the format organizationKey.tld (e.g. fixie.com)");
      return;
    }

    const domain = raw;

    // 1) prefix must match organizationKey
    const [prefix, ...rest] = domain.split(".");
    if (prefix !== organizationKey.toLowerCase()) {
      alert(`Domain must start with "${organizationKey}." (e.g. ${organizationKey}.com)`);
      return;
    }

    // 2) optionally restrict TLDs to .co / .com / .org
    const tld = rest.join("."); // "com", "co", "org", "co.uk", etc.
    const ALLOWED_TLDS = ["com", "co", "org"];
    if (!ALLOWED_TLDS.includes(tld)) {
      alert(`Only .co, .com or .org are allowed for ${organizationKey} (e.g. ${organizationKey}.com).`);
      return;
    }

    // Check if org exists
    const q = query(collection(db, "organizations"), where("domain", "==", domain));
    const existing = await getDocs(q);

    if (!existing.empty) {
      alert("This domain is already registered.");
      return;
    }

    const orgData = {
      domain,
      organizationKey,
      createdBy: user.email,
      createdAt: new Date(),
      members: {
        [user.uid]: {
          email: user.email,
          role: "admin",
          status: "active",
        },
      },
    };

    await addDoc(collection(db, "organizations"), orgData);
    setOrgDomain("");
    setCreatingOrg(false);

    console.log(`✅ Created new organization domain: ${domain}`);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // ===========================================================================
  // RENDER
  // ===========================================================================

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
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-btn" onClick={toggleSidebar}>
            <MenuIcon />
          </button>
          <h1>Fixie AI Support</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-1.5 rounded-md border transition-all duration-150 text-sm font-medium
                ${
                  activeTab === "chat"
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-indigo-400"
                }`}
            >
              Chats
            </button>

            {userRole === "admin" && (
              <button
                onClick={() => setActiveTab("organization")}
                className={`px-4 py-1.5 rounded-md border transition-all duration-150 text-sm font-medium
                  ${
                    activeTab === "organization"
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-indigo-400"
                  }`}
              >
                Organizations
              </button>
            )}
          </div>
        </div>

        <div className="header-right">
          <ThemeToggle />
          <button className="logout-btn" onClick={logout}>
            <LogoutIcon /> Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="dashboard-content">
        {activeTab === "chat" && (
          <div className="chat-tab flex h-full w-full bg-gray-900 text-gray-100">
            {/* LEFT: Sidebar (1/4 width) */}
            <aside className={`w-1/4 min-w-[16rem] border-r border-gray-800 bg-gray-800 flex flex-col ${isSidebarOpen ? 'block' : 'hidden md:flex'}`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <h2 className="text-sm font-semibold">Conversations</h2>
                <button
                  onClick={createNewConversation}
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md"
                >
                  <AddIcon /> New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-gray-400 text-sm px-4 py-6 text-center">
                    No conversations yet
                  </p>
                ) : (
                  conversations.map((convo) => (
                    <div
                      key={convo.id}
                      className={`flex items-center justify-between px-4 py-2 cursor-pointer transition ${
                        activeConvoId === convo.id
                          ? "bg-indigo-700 text-white"
                          : "hover:bg-gray-700"
                      }`}
                      onClick={() => {
                        setActiveConvoId(convo.id);
                        setIsSidebarOpen(false);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {formatConversationTitle(
                            convo.title || "New Chat",
                            activeConvoId === convo.id
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTimestamp(convo.updatedAt)}
                        </div>
                      </div>
                      <button
                        className="text-gray-400 hover:text-red-400 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(convo.id);
                        }}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </aside>

            {/* RIGHT: Main chat area (3/4 width) */}
            <section className="flex-1 flex flex-col">
              {!activeConvoId ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4">
                  <ChatIcon />
                  <h2 className="text-xl font-semibold">Welcome to Fixie AI Support</h2>
                  <p className="text-gray-400 text-sm">
                    Start a new conversation to get help with your IT issues.
                  </p>
                  <button
                    onClick={createNewConversation}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-white text-sm"
                  >
                    <AddIcon /> Start New Chat
                  </button>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))}

                    {/* Loading indicator (only if logic is processing but stream hasn't started painting yet) */}
                    {isLoading && !isStreaming && (
                      <div className="italic text-gray-400 text-sm">
                        Fixie is typing...
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="flex items-center p-3 border-t border-gray-700 bg-gray-800">
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
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="ml-3 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md text-sm text-white"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 🔹 Organization tab (Logic kept exactly as provided) */}
        {activeTab === "organization" && (
          <div className="organization-tab flex h-full bg-gray-900 text-gray-100">
            {/* LEFT SIDEBAR */}
            <aside className="w-1/4 min-w-[16rem] border-r border-gray-800 bg-gray-800 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-300">
                  Domains
                </h2>
                {userRole === "admin" && (
                  <button
                    onClick={() => {
                      setCreatingOrg(true);
                      setActiveOrgId(null);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md"
                  >
                    <AddIcon /> New
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {organizations.length === 0 ? (
                  <p className="text-gray-400 text-sm px-4 py-6 text-center">
                    No domains registered yet
                  </p>
                ) : (
                  organizations.map((org) => {
                    const membersObj = org.members || {};
                    const memberIds = Object.keys(membersObj);
                    const memberCount = memberIds.length;

                    return (
                      <div
                        key={org.id}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-800 transition ${
                          activeOrgId === org.id
                            ? "bg-indigo-700/60 text-white"
                            : "hover:bg-gray-700/60"
                        }`}
                        onClick={() => {
                          setActiveOrgId(org.id);
                          setCreatingOrg(false);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-gray-100 flex items-center gap-2">
                            🌐 {org.domain}
                          </div>

                          <div className="text-xs text-gray-400">
                            {memberCount > 0
                              ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
                              : "No members yet"}
                          </div>
                        </div>

                        {userRole === "admin" && (
                          <button
                            className="text-gray-400 hover:text-red-400 text-sm transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteOrganization(org.id);
                            }}
                          >
                            <DeleteIcon />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* RIGHT CONTENT AREA */}
            <section className="w-3/4 flex flex-col px-10 py-8 overflow-y-auto">
              {(creatingOrg || organizations.length === 0) && userRole === "admin" ? (
                <div className="max-w-2xl mx-auto space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold text-white">
                      🏢 Register a New Domain
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Add a domain to associate users automatically when they sign up.
                    </p>
                  </div>

                  <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Domain Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. gmail.com"
                        value={orgDomain}
                        onChange={(e) => setOrgDomain(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      onClick={createOrganization}
                      disabled={!orgDomain.trim()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition font-medium disabled:opacity-50"
                    >
                      Register Domain
                    </button>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-sm text-gray-400">
                    <p>
                      Once a domain is registered, any user signing up with an email
                      from that domain (e.g. <code>user@gmail.com</code>) will be
                      automatically linked to your organization.
                    </p>
                  </div>
                </div>
              ) : activeOrgId ? (
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">
                        🌐 {organizations.find((org) => org.id === activeOrgId)?.domain}
                      </h2>
                      <p className="text-gray-400 text-sm mt-1">
                        Created by{" "}
                        {organizations.find((org) => org.id === activeOrgId)?.createdBy || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-md">
                    <h3 className="text-lg font-medium mb-4 text-white">Members</h3>
                    <div className="space-y-3">
                      {(() => {
                        const org = organizations.find((org) => org.id === activeOrgId);
                        if (!org || !org.members) {
                          return (
                            <div className="text-gray-500 text-sm text-center py-6 border border-dashed border-gray-600 rounded-lg">
                              No users have signed up yet.
                            </div>
                          );
                        }
                        const membersArray = Object.entries(org.members).map(
                          ([uid, data]: [string, any]) => ({ uid, ...data })
                        );
                        if (membersArray.length === 0) {
                          return (
                            <div className="text-gray-500 text-sm text-center py-6 border border-dashed border-gray-600 rounded-lg">
                              No users have signed up yet.
                            </div>
                          );
                        }
                        return membersArray.map((member) => (
                          <div
                            key={member.uid}
                            className="flex justify-between items-center bg-gray-700/50 px-4 py-2 rounded-md"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-200">{member.email}</p>
                              <p className={`text-xs ${member.status === "verified" ? "text-green-400" : "text-yellow-400"}`}>
                                {member.status}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400">
                              {member.role || "user"}
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <p className="text-gray-500 text-sm">
                    Select a domain to view members.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

type DashboardProps = {
  userRole: string | null;
  organizationKey: string | null;
};

export default function Dashboard({ userRole, organizationKey }: DashboardProps) {
  return (
    <ThemeProvider>
      <DashboardContent userRole={userRole} organizationKey={organizationKey} />
    </ThemeProvider>
  );
}