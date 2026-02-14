import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import ChatMessage from "./ChatMessage";
import { Message, Conversation } from "../../types";
import { formatTimestamp, formatConversationTitle } from "../../utils";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useApi } from "../../hooks/useApi";
import "../../styles/Dashboard.css";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import BusinessIcon from '@mui/icons-material/Business';
import { motion, AnimatePresence } from "framer-motion";

// ICONS
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import MapsUgcIcon from '@mui/icons-material/MapsUgc';

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

    // Sync Ref for use in async closures
    useEffect(() => {
        activeConvoIdRef.current = activeConvoId;
    }, [activeConvoId]);

    // Auto-scroll logic
    useEffect(() => {
        const scrollBehavior = isLoading ? "smooth" : "auto";
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior });
        }, 150);
        return () => clearTimeout(timer);
    }, [messages, isLoading]);

    // --- THREAD LOADING ---
    const loadThreads = useCallback(async () => {
        if (!user) return;
        setIsThreadsLoading(true);
        try {
            const res = await fetchWithAuth("/threads");
            const data = await res.json();
            const mapped: Conversation[] = (data.threads || []).map((t: any) => ({
                id: t.thread_id,
                title: t.metadata?.title || "New Chat",
                updatedAt: new Date(t.updated_at || Date.now()),
                createdAt: new Date(t.created_at || Date.now()),
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

    // --- HISTORY LOADING ---
    useEffect(() => {
        if (!user || !activeConvoId) {
            setMessages([]); 
            return;
        }
        const abortController = new AbortController();
        let isMounted = true; 

        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const res = await fetchWithAuth(`/threads/${activeConvoId}/history`, {
                    signal: abortController.signal
                });
                const data = await res.json();
                
                const raw = data.messages || [];
                // We use the interrupts array from the state to see what is CURRENTLY paused
                const currentInterrupts = data.interrupts || [];
                
                const uiMessages: Message[] = raw.filter((m: any) => m.type !== "tool").map((m: any, index: number) => {
                    const isAi = m.type === "ai";
                    const hasToolCalls = isAi && m.tool_calls?.length > 0;
                    
                    // Find if there is an active interrupt for this specific message
                    // We match by checking if the interrupt exists in the state
                    const activeInt = isAi && currentInterrupts.length > 0 ? currentInterrupts[0] : null;
                
                    return {
                        id: m.id || `msg-${index}`,
                        role: m.type === "human" ? "user" : "assistant",
                        content: m.content || "",
                        createdAt: new Date(m.created_at || Date.now()),
                        // If an interrupt exists, mark this message as requiring action
                        status: (activeInt && index === raw.filter((msg: any) => msg.type !== "tool").length - 1 
                                 ? "requires_action" 
                                 : "completed") as Message['status'],
                        
                        // Use the streamlined 'type' as toolName
                        toolName: activeInt ? activeInt.value?.type : (hasToolCalls ? m.tool_calls[0].name : undefined),
                        
                        // Pass the entire value (including message, options, type)
                        toolArgs: activeInt ? activeInt.value : (hasToolCalls ? m.tool_calls[0].args : undefined),
                        
                        toolCallId: hasToolCalls ? m.tool_calls[0].id : undefined,
                    };
                });

                if (isMounted) setMessages(uiMessages);
            } catch (error: any) {
                if (error.name !== 'AbortError') console.error("History Load Error", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadHistory();
        return () => { isMounted = false; abortController.abort(); };
    }, [user, activeConvoId, fetchWithAuth]);

    // --- MESSAGE SENDING ---
    const handleSendMessage = async (text: string) => {
        if (!user || !activeConvoId || !text.trim() || isLoading) return;
        
        const currentConvoId = activeConvoId;
        setIsLoading(true);
        
        const tempUserMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text, createdAt: new Date() };
        setMessages((prev) => [...prev, tempUserMsg]);
        setInputMessage(""); 

        const isFirstMessage = messages.length === 0;

        try {
            const res = await fetchWithAuth("/chat", {
                method: "POST",
                body: JSON.stringify({ 
                    thread_id: currentConvoId, 
                    input: { messages: [{ role: "user", content: text }] } 
                }),
            });
            const data = await res.json();
            
            if (activeConvoIdRef.current !== currentConvoId) return;

            setMessages((prev) => [...prev, { 
                id: data.run_id || `ai-${Date.now()}`, 
                role: "assistant", 
                content: data.content, 
                status: data.status as Message['status'], 
                toolName: data.tool_name, // This will be 'selection' or 'confirmation'
                toolArgs: data.tool_args, // This contains the 'options' list
                runId: data.run_id, 
                createdAt: new Date() 
            }]);
            if (isFirstMessage) {
                loadThreads();
            }
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    // --- APPROVAL HANDLING ---
    // Inside ChatModule.tsx

    const handleApprovalAction = async (value: string, message: Message) => {
        if (!user || !activeConvoId || isLoading) return;
        
        // Optimistically set to processing
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: "processing" as Message['status'] } : m));
        setIsLoading(true);

        try {
            const res = await fetchWithAuth("/chat/action", { // Renamed endpoint
                method: "POST",
                body: JSON.stringify({ 
                    thread_id: activeConvoId, 
                    value: value // Changed key from 'action' to 'value'
                })
            });
            const data = await res.json();
            
            if (activeConvoIdRef.current !== activeConvoId) return;

            setMessages(prev => {
                const updated = prev.map(m => m.id === message.id ? { ...m, status: "completed" as Message['status'] } : m);
                
                return [...updated, { 
                    id: `res-${Date.now()}`, 
                    role: "assistant", 
                    content: data.content, 
                    createdAt: new Date(),
                    status: "completed" as Message['status']
                }];
            });

        } catch (error) { 
            console.error(error); 
            setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: "requires_action" as Message['status'] } : m));
        } finally {
            setIsLoading(false);
        }
    };

    // --- THREAD MANAGEMENT ---
    const createNewChat = async () => {
        setIsLoading(true);
        try {
            const res = await fetchWithAuth("/threads", {
                method: "POST",
                body: JSON.stringify({ metadata: { user_id: user?.uid } })
            });
            const data = await res.json();
            
            setActiveConvoId(data.thread_id);
            setMessages([]); 
            loadThreads();
            setIsSidebarOpen(false);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const deleteConversation = async (convoId: string) => {
        if (!window.confirm("Delete this conversation?")) return;
        try {
            await fetchWithAuth(`/threads/${convoId}`, { method: "DELETE" });
            const remaining = conversations.filter((c) => c.id !== convoId);
            setConversations(remaining);
            if (activeConvoId === convoId) setActiveConvoId(remaining.length > 0 ? remaining[0].id : null);
        } catch (error) { console.error(error); }
    };

    return (
        <div className="chat-tab flex h-full w-full bg-[var(--bg-primary)]">
            <aside className={`sidebar w-1/4 min-w-[18rem] flex flex-col ${isSidebarOpen ? 'open' : 'hidden md:flex'}`}>
                <div className="sidebar-header flex items-center justify-between px-4 py-4">
                    <h2 className="text-sm font-bold tracking-tight uppercase opacity-50 text-[var(--text-primary)]">History</h2>
                    <motion.button 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
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
                                        onClick={() => { setActiveConvoId(convo.id); setIsSidebarOpen(false); }}
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
                                            whileHover={{ scale: 1.2, color: "#f87171" }} whileTap={{ scale: 0.9 }}
                                            className="delete-conversation-btn p-1 ml-2 text-[var(--text-muted)]"
                                            onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }}
                                        >
                                            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
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
                                <button onClick={() => { setActiveTab("organization");  }} className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === 'organization' ? 'bg-indigo-600/10 text-indigo-500' : 'text-[var(--text-secondary)]'}`}>
                                    <BusinessIcon fontSize="small" /> Organization
                                </button>
                                <button onClick={() => { setActiveTab("tools");  }} className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === 'tools' ? 'bg-indigo-600/10 text-indigo-500' : 'text-[var(--text-secondary)]'}`}>
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

            <section className="chat-view flex-1 flex flex-col relative bg-[var(--bg-primary)] h-full overflow-hidden">
                <AnimatePresence mode="wait">
                    {isThreadsLoading && conversations.length === 0 ? (
                        <motion.div key="h-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full" />
                                <motion.div animate={{ rotate: 360, scale: [1, 1.05, 1] }} transition={{ rotate: { duration: 5, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }} className="relative w-20 h-20 bg-[var(--bg-secondary)] border border-indigo-500/30 rounded-3xl flex items-center justify-center shadow-2xl">
                                    <AutoAwesomeIcon sx={{ fontSize: 32, color: '#8EBBFF' }} />
                                </motion.div>
                            </div>
                            <span className="text-sm font-bold tracking-widest uppercase text-[var(--text-secondary)] animate-pulse">Initializing Session</span>
                        </motion.div>
                    ) : conversations.length === 0 ? (
                        <motion.div key="welcome-invite" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="p-6 bg-[var(--bg-secondary)] rounded-3xl mb-8 border border-[var(--border-primary)] shadow-2xl relative">
                                <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
                                <MapsUgcIcon sx={{ fontSize: 64, color: 'var(--accent-primary)', position: 'relative' }} />
                            </div>
                            <h2 className="text-4xl font-black mb-4 text-[var(--text-primary)] tracking-tight">Hi, I'm <span className="text-indigo-500">Fixie</span>.</h2>
                            <p className="text-[var(--text-secondary)] text-lg max-w-md mb-10 leading-relaxed">Your assistant for technical issues and account automation. Ready to start?</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={createNewChat}
                                className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center gap-3"
                            >
                                <AddIcon /> Start Your First Conversation
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div key="active-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="chat-messages flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                                {messages.map((msg) => (
                                    <ChatMessage key={msg.id} message={msg} onApprovalAction={handleApprovalAction} />
                                ))}
                                {isLoading && (
                                    <div className="flex items-center gap-3 p-2 ml-10">
                                        <AutoAwesomeIcon sx={{ fontSize: 18, color: '#8EBBFF' }} className="animate-spin-slow" />
                                        <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Thinking</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chat-input-area p-6 bg-[var(--bg-primary)] border-t border-[var(--border-primary)]">
                                <div className="modern-input-wrapper flex items-center gap-2 p-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full focus-within:border-indigo-500/50 transition-all shadow-sm">
                                    <input 
                                        className="modern-input-field flex-1 bg-transparent border-none outline-none pl-5 pr-2 text-sm text-[var(--text-primary)] placeholder:opacity-40" 
                                        value={inputMessage} 
                                        onChange={(e) => setInputMessage(e.target.value)} 
                                        onKeyDown={(e) => e.key === "Enter" && inputMessage.trim() && !isLoading && handleSendMessage(inputMessage)} 
                                        placeholder="Describe your issue..." 
                                        disabled={isLoading} 
                                    />
                                    <motion.button 
                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} 
                                        className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full disabled:opacity-20 shadow-lg shadow-indigo-500/20" 
                                        onClick={() => handleSendMessage(inputMessage)} 
                                        disabled={!inputMessage.trim() || isLoading}
                                    >
                                        <SendIcon sx={{ fontSize: 18, transform: 'rotate(-30deg) translateY(-1px) translateX(1px)' }} />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
};

export default ChatModule;