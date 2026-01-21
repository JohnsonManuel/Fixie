import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import ChatMessage from "../chat/ChatMessage";
import { Message, Conversation } from "../../types";
import { formatTimestamp, formatConversationTitle } from "../../utils";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useApi } from "../../hooks/useApi";
import "../../styles/Dashboard.css";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { motion, AnimatePresence } from "framer-motion";

// ICONS
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import BusinessIcon from '@mui/icons-material/Business';

type ChatModuleProps = {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    activeTab: "chat" | "organization" | "tools";
    setActiveTab: (tab: "chat" | "organization" | "tools") => void;
    userRole: string | null;
    logout: () => void;
};

const ChatModule = ({ 
    isSidebarOpen, 
    setIsSidebarOpen, 
    activeTab, 
    setActiveTab, 
    userRole, 
    logout 
}: ChatModuleProps) => {
    const { user } = useAuth();
    const { fetchWithAuth } = useApi();
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isThreadsLoading, setIsThreadsLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activeConvoIdRef = useRef(activeConvoId);

    useEffect(() => {
        activeConvoIdRef.current = activeConvoId;
        setInputMessage(""); 
    }, [activeConvoId]);

    useEffect(() => {
        const scrollBehavior = isLoading ? "smooth" : "auto";
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior });
        }, 50);
        return () => clearTimeout(timer);
    }, [messages, isLoading]);

    const loadThreads = useCallback(async () => {
        if (!user) return;
        setIsThreadsLoading(true);
        try {
            const res = await fetchWithAuth("/threads");
            const data = await res.json();
            const mapped: Conversation[] = data.threads.map((t: any) => ({
                id: t.thread_id,
                title: t.metadata?.title || "New Chat",
                updatedAt: t.updated_at ? new Date(t.updated_at) : new Date(),
                createdAt: t.created_at ? new Date(t.created_at) : new Date(),
            }));
            mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setConversations(mapped);
            if (mapped.length > 0 && !activeConvoIdRef.current) {
                setActiveConvoId(mapped[0].id);
            }
        } catch (error) {
            console.error("Failed to load threads", error);
        } finally {
            setIsThreadsLoading(false);
        }
    }, [user, fetchWithAuth]);

    useEffect(() => { loadThreads(); }, [loadThreads]);

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
                if (isMounted) setMessages(uiMessages);
            } catch (error: any) {
                if (error.name !== 'AbortError') console.error("Failed to load history", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadHistory();
        return () => { isMounted = false; abortController.abort(); };
    }, [user, activeConvoId, fetchWithAuth]);

    const deleteConversation = async (convoId: string) => {
        if (!window.confirm("Are you sure you want to delete this conversation?")) return;
        try {
            await fetchWithAuth(`/threads/${convoId}`, { method: "DELETE" });
            const remaining = conversations.filter((c) => c.id !== convoId);
            setConversations(remaining);
            if (activeConvoId === convoId) {
                setActiveConvoId(remaining.length > 0 ? remaining[0].id : null);
            }
        } catch (error) { console.error("Error deleting thread:", error); }
    };

    const handleSendMessage = async (text: string) => {
        if (!user || !activeConvoId || !text.trim() || isLoading) return;
        setIsLoading(true);
        const tempUserMsg: Message = { id: Date.now().toString(), role: "user", content: text, createdAt: new Date() };
        setMessages((prev) => [...prev, tempUserMsg]);
        setInputMessage(""); 

        try {
            const res = await fetchWithAuth("/chat", {
                method: "POST",
                body: JSON.stringify({ thread_id: activeConvoId, input: { messages: [{ role: "user", content: text }] } }),
            });
            const data = await res.json();
            if (activeConvoIdRef.current !== activeConvoId) return;
            const aiMsg: Message = { 
                id: data.message_id || `ai-${Date.now()}`, role: "assistant", content: data.content, 
                status: data.status, toolName: data.tool_name, toolArgs: data.tool_args, 
                toolCallId: data.tool_call_id, runId: data.run_id, createdAt: new Date() 
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const handleApprovalAction = async (action: "approve" | "reject", message: Message) => {
        if (!user || !activeConvoId || !message.runId || !message.toolCallId) return;
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: "action_taken" } : m));
        try {
            const res = await fetchWithAuth("/chat/approval", {
                method: "POST",
                body: JSON.stringify({ thread_id: activeConvoId, run_id: message.runId, tool_call_id: message.toolCallId, action })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { id: `resp-${Date.now()}`, role: "assistant", content: data.content, createdAt: new Date() }]);
        } catch (error) { console.error(error); }
    };

    // 1. ADD THIS FUNCTION: Create New Chat
    const createNewChat = async () => {
        try {
            setIsThreadsLoading(true);
            // Call your API to create a new thread
            const res = await fetchWithAuth("/threads", {
                method: "POST",
                body: JSON.stringify({ metadata: { title: "New Chat" } })
            });
            const data = await res.json();

            const newConvo: Conversation = {
                id: data.thread_id,
                title: "New Chat",
                updatedAt: new Date(),
                createdAt: new Date(),
            };

            // Update state: Add to top of list and make active
            setConversations(prev => [newConvo, ...prev]);
            setActiveConvoId(newConvo.id);
            
            // On mobile, close sidebar to show the new empty chat
            setIsSidebarOpen(false);
        } catch (error) {
            console.error("Failed to create new chat", error);
        } finally {
            setIsThreadsLoading(false);
        }
    };

    // Mobile UX: Close sidebar on convo selection
    const selectConversation = (id: string) => {
        setActiveConvoId(id);
        setIsSidebarOpen(false);
    };

    return (
        <div className="chat-tab flex h-full w-full bg-[var(--bg-primary)]">
            <aside className={`sidebar w-1/4 min-w-[18rem] flex flex-col ${isSidebarOpen ? 'open' : 'hidden md:flex'}`}>
                <div className="sidebar-header flex items-center justify-between px-4 py-4">
                    <h2 className="text-sm font-bold tracking-tight uppercase opacity-50 text-[var(--text-primary)]">History</h2>
                    
                    {/* 2. UPDATE ONCLICK HERE */}
                    <motion.button 
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }} 
                        onClick={createNewChat} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg shadow-indigo-500/20"
                    >
                        <AddIcon sx={{ fontSize: 16 }}/> New Chat
                    </motion.button>
                </div>

                <div className="conversations-list flex-1 overflow-y-auto px-2">
                    <AnimatePresence mode="wait">
                        {isThreadsLoading ? (
                            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex flex-col gap-2 px-3">
                                        <div className="h-4 w-3/4 bg-[var(--bg-tertiary)] rounded relative overflow-hidden">
                                            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5 }}/>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.05 }}>
                                {conversations.map((convo) => (
                                    <motion.div 
                                        key={convo.id} 
                                        whileHover={{ x: 4, backgroundColor: "var(--bg-tertiary)" }} 
                                        className={`conversation-item flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer mb-1 transition-all ${activeConvoId === convo.id ? "active" : ""}`} 
                                        onClick={() => selectConversation(convo.id)}
                                    >
                                        <div className="conversation-content flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate text-[var(--text-primary)]">
                                                {formatConversationTitle(convo.title, activeConvoId === convo.id)}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold tracking-wider opacity-40 mt-1 text-[var(--text-secondary)]">
                                                {formatTimestamp(convo.updatedAt)}
                                            </div>
                                        </div>

                                        <motion.button 
                                            whileHover={{ scale: 1.2, color: "#f87171" }}
                                            whileTap={{ scale: 0.9 }}
                                            className="delete-conversation-btn p-1 ml-2 text-[var(--text-muted)]"
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                deleteConversation(convo.id); 
                                            }}
                                        >
                                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="sidebar-footer border-t border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]">
                    <div className="md:hidden space-y-1 mb-4">
                        {userRole === "admin" && (
                            <>
                                <button onClick={() => { setActiveTab("organization"); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === 'organization' ? 'bg-indigo-600/10 text-indigo-500' : 'text-[var(--text-secondary)]'}`}>
                                    <BusinessIcon fontSize="small" /> Organization
                                </button>
                                <button onClick={() => { setActiveTab("tools"); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === 'tools' ? 'bg-indigo-600/10 text-indigo-500' : 'text-[var(--text-secondary)]'}`}>
                                    <SettingsSuggestIcon fontSize="small" /> Tool Manager
                                </button>
                            </>
                        )}
                    </div>
                    <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                        <LogoutIcon fontSize="small" /> Sign Out
                    </button>
                </div>
            </aside>

            <section className="chat-view flex-1 flex flex-col relative bg-[var(--bg-primary)]">
                <AnimatePresence mode="wait">
                    {isLoading && messages.length === 0 ? (
                        <motion.div key="h-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full" />
                                <motion.div animate={{ rotate: 360, scale: [1, 1.05, 1] }} transition={{ rotate: { duration: 5, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }} className="relative w-20 h-20 bg-[var(--bg-secondary)] border border-indigo-500/30 rounded-3xl flex items-center justify-center shadow-2xl">
                                    <AutoAwesomeIcon sx={{ fontSize: 32, color: '#8EBBFF' }} />
                                </motion.div>
                            </div>
                            <span className="text-sm font-bold tracking-widest uppercase text-[var(--text-secondary)] animate-pulse">Initializing Session</span>
                        </motion.div>
                    ) : messages.length === 0 ? (
                        <motion.div key="welcome" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center text-center p-8">
                             <ChatBubbleOutlineIcon style={{ fontSize: 64, color: 'var(--accent-primary)', opacity: 0.1 }} />
                             <h2 className="text-2xl font-bold mt-4 opacity-80 text-[var(--text-primary)]">How can I help you today?</h2>
                        </motion.div>
                    ) : (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chat-messages flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                            <div className="chat-spacer flex-1" />
                            {messages.map((msg) => <ChatMessage key={msg.id} message={msg} onApprovalAction={handleApprovalAction} />)}
                            {isLoading && (
                                <div className="flex items-center gap-3 p-2 ml-10">
                                    <AutoAwesomeIcon sx={{ fontSize: 18, color: '#8EBBFF' }} className="animate-spin-slow" />
                                    <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Thinking</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="chat-input-area p-6 bg-[var(--bg-primary)]">
                    <div className="modern-input-wrapper flex items-center gap-2 p-1.5 bg-[var(--bg-secondary)] backdrop-blur-xl border border-[var(--border-primary)] rounded-full focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-sm">
                        <input 
                            type="text" 
                            className="modern-input-field flex-1 bg-transparent border-none outline-none pl-5 pr-2 text-sm text-[var(--text-primary)] placeholder:opacity-40" 
                            value={inputMessage} 
                            onChange={(e) => setInputMessage(e.target.value)} 
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && inputMessage.trim() && !isLoading) {
                                    handleSendMessage(inputMessage);
                                }
                            }} 
                            placeholder="Describe your issue..." 
                            disabled={isLoading} 
                        />
                        <motion.button 
                            whileHover={inputMessage.trim() ? { scale: 1.1 } : {}} 
                            whileTap={inputMessage.trim() ? { scale: 0.9 } : {}} 
                            className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full disabled:opacity-20 disabled:grayscale shadow-lg shadow-indigo-500/20" 
                            onClick={() => handleSendMessage(inputMessage)} 
                            disabled={!inputMessage.trim() || isLoading}
                        >
                            <SendIcon sx={{ fontSize: 18, transform: 'rotate(-30deg) translateY(-1px) translateX(1px)' }} />
                        </motion.button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ChatModule;