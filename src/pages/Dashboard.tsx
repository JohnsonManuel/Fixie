import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import "../styles/Dashboard.css";
import ChatMessage from "../components/chat/ChatMessage";
import ThemeToggle from "../components/ThemeToggle";
import OrganizationTools from "../components/OrganizationTools";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { config } from "../services/config";
import { Message, Conversation } from "../types";
import { formatTimestamp, formatConversationTitle } from "../utils";
import { db } from "../services/firebase"; 
import {
    addDoc,
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
    deleteDoc,
    doc
} from "firebase/firestore";

// =============================================================================
// ICONS (Material UI)
// =============================================================================
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

// =============================================================================
// CONFIG
// =============================================================================

const RAW_API_URL = config.functions.main_endpoint || "";
const API_BASE_URL = RAW_API_URL.endsWith("/") 
    ? RAW_API_URL.slice(0, -1) 
    : RAW_API_URL;

// =============================================================================
// COMPONENT
// =============================================================================

type DashboardContentProps = {
    userRole: string | null;
    organizationKey: string | null;
};

function DashboardContent({ userRole, organizationKey }: DashboardContentProps) {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    
    // UI State
    const [activeTab, setActiveTab] = useState<"chat" | "organization" | "tools">("chat");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Chat State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Organization State
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
    const [creatingOrg, setCreatingOrg] = useState(false);
    const [orgDomain, setOrgDomain] = useState("");

    // REF: Track active conversation ID for async safety
    const activeConvoIdRef = useRef(activeConvoId);
    useEffect(() => {
        activeConvoIdRef.current = activeConvoId;
    }, [activeConvoId]);

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

        if (!res.ok) { 
            let err = res.statusText;
            try {
                const jsonError = await res.json();
                err = jsonError.detail || JSON.stringify(jsonError);
            } catch {
                err = await res.text();
            }
            throw new Error(err || res.statusText);
        }
        return res;
    }, [user]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]); 

    // ===========================================================================
    // 1. LOAD THREADS (GET /threads)
    // ===========================================================================
    const loadThreads = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetchWithAuth("/threads");
            const data = await res.json();
            
            const mapped: Conversation[] = data.threads.map((t: any) => ({
                id: t.thread_id,
                title: t.metadata?.title || "New Chat",
                updatedAt: t.updated_at ? new Date(t.updated_at) : new Date(),
                createdAt: t.created_at ? new Date(t.created_at) : new Date(),
            }));

            mapped.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

            setConversations(mapped);
            
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
        setMessages([]); 
        
        if (!user || !activeConvoId) return;

        const abortController = new AbortController();
        let isMounted = true; 

        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const res = await fetchWithAuth(`/threads/${activeConvoId}/history`, {
                    signal: abortController.signal
                });
                const data = await res.json();

                const uiMessages: Message[] = (data.messages || []).map((m: any, index: number) => ({
                    id: m.id || `msg-${index}`,
                    role: m.type === "human" ? "user" : "assistant",
                    content: m.content,
                    createdAt: new Date(),
                    status: m.status,
                    toolName: m.toolName,
                    toolArgs: m.toolArgs,
                    toolCallId: m.toolCallId,
                    runId: m.runId
                }));
                
                if (isMounted) {
                    setMessages(uiMessages);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error("Failed to load history", error);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadHistory();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [user, activeConvoId, fetchWithAuth]);

    useEffect(() => {
        setInputMessage("");
    }, [activeConvoId]);

    // ===========================================================================
    // 3. CREATE THREAD (POST /threads)
    // ===========================================================================
    const createNewConversation = async () => {
        try {
            const res = await fetchWithAuth("/threads", { method: "POST" });
            const data = await res.json();
            
            const newConvo: Conversation = {
                id: data.thread_id,
                title: "New Chat",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            setConversations([newConvo, ...conversations]);
            setActiveConvoId(data.thread_id);
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
            }
        } catch (error) {
            console.error("Error deleting thread", error);
        }
    };

    // ===========================================================================
    // 5. HANDLE APPROVAL
    // ===========================================================================
    const handleApprovalAction = async (action: "approve" | "reject", message: Message) => {
        if (!user || !activeConvoId || !message.runId || !message.toolCallId) return;

        setMessages(prev => prev.map(m => 
            m.id === message.id ? { ...m, status: "action_taken" } : m
        ));
        
        const tempId = "proc-" + Date.now();
        setMessages(prev => [...prev, {
            id: tempId,
            role: "assistant",
            content: action === "approve" ? "Processing approval..." : "Cancelling request...",
            createdAt: new Date()
        }]);

        try {
            const res = await fetchWithAuth("/chat/approval", {
                method: "POST",
                body: JSON.stringify({
                    thread_id: activeConvoId,
                    run_id: message.runId,
                    tool_call_id: message.toolCallId,
                    action: action
                })
            });

            const data = await res.json();
            
            if (activeConvoIdRef.current !== activeConvoId) return;

            setMessages(prev => prev.map(m => 
                m.id === tempId ? {
                    ...m,
                    content: data.content,
                    status: data.status,
                    id: `resp-${Date.now()}`
                } : m
            ));

        } catch (error) {
            console.error("Approval Error", error);
            if (activeConvoIdRef.current === activeConvoId) {
                setMessages(prev => prev.map(m => 
                    m.id === tempId ? { ...m, content: "Error processing action." } : m
                ));
            }
        }
    };

    // ===========================================================================
    // 6. SEND CHAT (POST /chat)
    // ===========================================================================
    const handleSendMessage = async (text: string): Promise<void> => {
        const currentConvo = conversations.find(c => c.id === activeConvoId);
        const isFirstMessage = currentConvo?.title === "New Chat";
        
        if (!user || !activeConvoId || !text.trim() || isLoading) return;
    
        setIsLoading(true);
    
        const tempUserMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            createdAt: new Date(),
        };
        setMessages((prev) => [...prev, tempUserMsg]);
    
        const tempAiMsgId = "temp-ai-" + Date.now();
        setMessages((prev) => [...prev, {
            id: tempAiMsgId,
            role: "assistant",
            content: "Fixie is thinking...", 
            createdAt: new Date(),
        }]);
    
        try {
            const res = await fetchWithAuth("/chat", {
                method: "POST",
                body: JSON.stringify({
                    thread_id: activeConvoId,
                    input: { messages: [{ role: "user", content: text }] } 
                }),
            });
    
            const data = await res.json();
    
            if (activeConvoIdRef.current !== activeConvoId) return;

            setMessages((prev) => 
                prev.map((msg) => {
                    if (msg.id === tempAiMsgId) {
                        const updatedMsg: Message = {
                            ...msg,
                            content: data.content,
                            id: data.message_id || tempAiMsgId,
                            status: data.status
                        };

                        if (data.status === "requires_action") {
                            updatedMsg.toolName = data.tool_name;
                            updatedMsg.toolArgs = data.tool_args;
                            updatedMsg.toolCallId = data.tool_call_id;
                            updatedMsg.runId = data.run_id;
                        }
                        return updatedMsg;
                    }
                    return msg;
                })
            );
    
            if (isFirstMessage) {
                await loadThreads();
            }
    
        } catch (error) {
            console.error("Chat error", error);
            if (activeConvoIdRef.current === activeConvoId) {
                setMessages((prev) => 
                    prev.map((msg) => 
                        msg.id === tempAiMsgId ? { ...msg, content: "Error: Could not get response." } : msg
                    )
                );
            }
        } finally {
            if (activeConvoIdRef.current === activeConvoId) {
                setIsLoading(false);
            }
        }
    };

    // ===========================================================================
    // ORGANIZATION LOGIC
    // ===========================================================================
    
    useEffect(() => {
        if (!user) return;
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

    const deleteOrganization = async (orgId: string) => {
        if (!window.confirm("Are you sure...")) return;
        try {
            await deleteDoc(doc(db, "organizations", orgId));
            if (activeOrgId === orgId) setActiveOrgId(null);
        } catch (e) {
            console.error("Error deleting org", e);
            alert("Failed to delete organization");
        }
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

        raw = raw.replace(/^@/, "");
        const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
        if (!DOMAIN_PATTERN.test(raw)) {
            alert("Domain must be in the format organizationKey.tld (e.g. fixie.com)");
            return;
        }

        const domain = raw;
        const [prefix, ...rest] = domain.split(".");
        if (prefix !== organizationKey.toLowerCase()) {
            alert(`Domain must start with "${organizationKey}." (e.g. ${organizationKey}.com)`);
            return;
        }

        const tld = rest.join(".");
        const ALLOWED_TLDS = ["com", "co", "org"];
        if (!ALLOWED_TLDS.includes(tld)) {
            alert(`Only .co, .com or .org are allowed.`);
            return;
        }

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
        // Applied 'data-theme' to trigger CSS variables
        <div className="dashboard" data-theme={theme}>
            {/* HEADER */}
            <header className="dashboard-header">
                <div className="header-left">
                    <button className="menu-btn" onClick={toggleSidebar}>
                        <MenuIcon fontSize="small" />
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

                        {userRole === "admin" && (
                            <button
                                onClick={() => setActiveTab("tools")}
                                className={`px-4 py-1.5 rounded-md border transition-all duration-150 text-sm font-medium
                                    ${
                                        activeTab === "tools"
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                            : "border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-indigo-400"
                                    }`}
                            >
                                Tools
                            </button>
                        )}
                    </div>
                </div>

                <div className="header-right">
                    <ThemeToggle />
                    <button 
                        className="logout-btn" 
                        onClick={logout}
                        title="Sign out"
                    >
                        <LogoutIcon fontSize="small" /> <span>Logout</span>
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="dashboard-content">
                {activeTab === "chat" && (
                    <div className="chat-tab flex h-full w-full">
                        {/* LEFT: Sidebar */}
                        <aside className={`sidebar w-1/4 min-w-[16rem] flex flex-col ${isSidebarOpen ? 'block' : 'hidden md:flex'}`}>
                            <div className="sidebar-header flex items-center justify-between px-4 py-3">
                                <h2 className="text-sm font-semibold">Conversations</h2>
                                <button
                                    onClick={createNewConversation}
                                    className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md"
                                >
                                    <AddIcon fontSize="small" /> New
                                </button>
                            </div>

                            <div className="conversations-list flex-1 overflow-y-auto">
                                {conversations.length === 0 ? (
                                    <p className="text-gray-400 text-sm px-4 py-6 text-center">
                                        No conversations yet
                                    </p>
                                ) : (
                                    conversations.map((convo) => (
                                        <div
                                            key={convo.id}
                                            // Replaced conditional Tailwind classes with 'active' class logic
                                            className={`conversation-item flex items-center justify-between px-4 py-2 cursor-pointer transition ${
                                                activeConvoId === convo.id
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() => {
                                                setActiveConvoId(convo.id);
                                                setIsSidebarOpen(false);
                                            }}
                                        >
                                            <div className="conversation-content flex-1 min-w-0">
                                                <div className="conversation-title text-sm font-medium truncate">
                                                    {formatConversationTitle(
                                                        convo.title || "New Chat",
                                                        activeConvoId === convo.id
                                                    )}
                                                </div>
                                                <div className="conversation-meta text-xs">
                                                    {formatTimestamp(convo.updatedAt)}
                                                </div>
                                            </div>
                                            <button
                                                className="delete-conversation-btn text-gray-400 hover:text-red-400 text-sm ml-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteConversation(convo.id);
                                                }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </aside>

                        {/* RIGHT: Main chat area */}
                        <section className="chat-view flex-1 flex flex-col">
                            {!activeConvoId ? (
                                <div className="no-conversation flex flex-col items-center justify-center flex-1 text-center space-y-4">
                                    <div className="no-conversation-content">
                                        <ChatBubbleOutlineIcon style={{ fontSize: 48, color: 'var(--text-muted)' }} />
                                        <h2 className="text-xl font-semibold">Welcome to Fixie AI Support</h2>
                                        <p className="text-gray-400 text-sm">
                                            Start a new conversation to get help with your IT issues.
                                        </p>
                                        <button
                                            onClick={createNewConversation}
                                            className="start-chat-btn flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-white text-sm"
                                        >
                                            <AddIcon fontSize="small" /> Start New Chat
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Kept overflow-hidden to fix layout issues
                                <div className="chat-container flex flex-col flex-1 overflow-hidden">
                                    
                                    <div className="chat-messages flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                                        {messages.map((msg) => (
                                            <ChatMessage 
                                                key={msg.id} 
                                                message={msg} 
                                                onApprovalAction={handleApprovalAction} 
                                            />
                                        ))}

                                        {isLoading && (
                                            <div className="typing-indicator italic text-gray-400 text-sm">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                                Fixie is thinking...
                                            </div>
                                        )}

                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Modern Gemini-Style Input */}
                                    <div className="chat-input-area">
                                        <div className="modern-input-wrapper">
                                            <input
                                                type="text"
                                                className="modern-input-field"
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
                                                placeholder="Message Fixie..."
                                                disabled={isLoading}
                                            />
                                            <button
                                                className="modern-send-btn"
                                                onClick={() => {
                                                    if (inputMessage.trim() && !isLoading) {
                                                        handleSendMessage(inputMessage);
                                                        setInputMessage("");
                                                    }
                                                }}
                                                disabled={!inputMessage.trim() || isLoading}
                                                title="Send message"
                                            >
                                                <SendIcon fontSize="small" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* Organization tab */}
                {activeTab === "organization" && (
                    <div className="organization-tab flex h-full w-full">
                        <aside className={`sidebar w-1/4 min-w-[16rem] flex flex-col ${isSidebarOpen ? 'block' : 'hidden md:flex'}`}>
                            <div className="sidebar-header flex items-center justify-between px-4 py-3">
                                <h2 className="text-sm font-semibold tracking-wide uppercase">
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
                                        <AddIcon fontSize="small" /> New
                                    </button>
                                )}
                            </div>

                            <div className="conversations-list flex-1 overflow-y-auto">
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
                                                className={`conversation-item flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-800 transition ${
                                                    activeOrgId === org.id
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() => {
                                                    setActiveOrgId(org.id);
                                                    setCreatingOrg(false);
                                                }}
                                            >
                                                <div className="conversation-content flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate flex items-center gap-2">
                                                        🌐 {org.domain}
                                                    </div>

                                                    <div className="conversation-meta text-xs text-gray-400">
                                                        {memberCount > 0
                                                            ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
                                                            : "No members yet"}
                                                    </div>
                                                </div>

                                                {userRole === "admin" && (
                                                    <button
                                                        className="delete-conversation-btn text-gray-400 hover:text-red-400 text-sm transition"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteOrganization(org.id);
                                                        }}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </aside>

                        <section className="w-3/4 flex flex-col px-10 py-8 overflow-y-auto">
                            {(creatingOrg || organizations.length === 0) && userRole === "admin" ? (
                                <div className="max-w-2xl mx-auto space-y-8">
                                    <div className="text-center space-y-2">
                                        <h2 className="text-2xl font-semibold">
                                            🏢 Register a New Domain
                                        </h2>
                                        <p className="text-gray-400 text-sm">
                                            Add a domain to associate users automatically when they sign up.
                                        </p>
                                    </div>

                                    <div className="border border-gray-700 rounded-xl p-6 shadow-lg space-y-6 bg-[var(--bg-secondary)]">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Domain Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. gmail.com"
                                                value={orgDomain}
                                                onChange={(e) => setOrgDomain(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
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
                                </div>
                            ) : activeOrgId ? (
                                <div className="max-w-3xl mx-auto space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-semibold">
                                                🌐 {organizations.find((org) => org.id === activeOrgId)?.domain}
                                            </h2>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Created by{" "}
                                                {organizations.find((org) => org.id === activeOrgId)?.createdBy || "Unknown"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border border-gray-700 rounded-xl p-6 shadow-md bg-[var(--bg-secondary)]">
                                        <h3 className="text-lg font-medium mb-4">Members</h3>
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
                                                        className="flex justify-between items-center px-4 py-2 rounded-md bg-[var(--bg-primary)]"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium">{member.email}</p>
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

                {/* Tools tab */}
                {activeTab === "tools" && userRole === "admin" && (
                    <div className="tools-tab flex h-full w-full">
                        {/* LEFT: Organizations Sidebar */}
                        <aside className={`sidebar w-1/4 min-w-[16rem] flex flex-col ${isSidebarOpen ? 'block' : 'hidden md:flex'}`}>
                            <div className="sidebar-header flex items-center justify-between px-4 py-3">
                                <h2 className="text-sm font-semibold tracking-wide uppercase">
                                    Organizations
                                </h2>
                            </div>

                            <div className="conversations-list flex-1 overflow-y-auto">
                                {organizations.length === 0 ? (
                                    <p className="text-gray-400 text-sm px-4 py-6 text-center">
                                        No organizations yet
                                    </p>
                                ) : (
                                    organizations.map((org) => {
                                        const membersObj = org.members || {};
                                        const memberIds = Object.keys(membersObj);
                                        const memberCount = memberIds.length;

                                        return (
                                            <div
                                                key={org.id}
                                                className={`conversation-item flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-800 transition ${
                                                    activeOrgId === org.id
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() => {
                                                    setActiveOrgId(org.id);
                                                }}
                                            >
                                                <div className="conversation-content flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate flex items-center gap-2">
                                                        🌐 {org.domain}
                                                    </div>

                                                    <div className="conversation-meta text-xs text-gray-400">
                                                        {memberCount > 0
                                                            ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
                                                            : "No members yet"}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </aside>

                        {/* RIGHT: Main Content Area */}
                        <section className="w-3/4 flex flex-col px-10 py-8 overflow-y-auto">
                            {activeOrgId && user ? (
                                <OrganizationTools
                                    organizationId={activeOrgId}
                                    organizationDomain={organizations.find((org) => org.id === activeOrgId)?.domain || ""}
                                    userEmail={user.email || ""}
                                />
                            ) : (
                                <div className="flex items-center justify-center flex-1">
                                    <div className="text-center space-y-4">
                                        <div className="text-6xl mb-4">🛠️</div>
                                        <h2 className="text-2xl font-semibold">Admin Tools</h2>
                                        <p className="text-gray-400 text-sm">
                                            Select an organization from the left to view available tools.
                                        </p>
                                    </div>
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