import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import ChatMessage from "../chat/ChatMessage";
import { config } from "../../services/config";
import { Message, Conversation } from "../../types";
import { formatTimestamp, formatConversationTitle } from "../../utils";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useApi } from "../../hooks/useApi";
import "../../styles/Dashboard.css";
import { motion, AnimatePresence } from "framer-motion";

// ICONS
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const RAW_API_URL = config.functions.main_endpoint || "";
const API_BASE_URL = RAW_API_URL.endsWith("/") 
    ? RAW_API_URL.slice(0, -1) 
    : RAW_API_URL;

type ChatModuleProps = {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
};

const ChatModule = ({ isSidebarOpen, setIsSidebarOpen }: ChatModuleProps) => {
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

    // Sync Ref with State
    useEffect(() => {
        activeConvoIdRef.current = activeConvoId;
        setInputMessage(""); 
    }, [activeConvoId]);

    // Handle Scrolling Logic
    useEffect(() => {
        const scrollBehavior = isLoading ? "smooth" : "auto";
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior });
        }, 50);
        return () => clearTimeout(timer);
    }, [messages, isLoading]);

    // LOAD THREADS (Sorted by Latest Created)
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
    
            // Sort by Created Date (Latest First)
            mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setConversations(mapped);
    
            // Auto-select most recent if none active
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

    // LOAD MESSAGE HISTORY
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
        } catch (error) { console.error("Error creating thread", error); }
    };

    const deleteConversation = async (convoId: string) => {
        try {
            await fetchWithAuth(`/threads/${convoId}`, { method: "DELETE" });
            const remaining = conversations.filter((c) => c.id !== convoId);
            setConversations(remaining);
            if (activeConvoId === convoId) {
                setActiveConvoId(remaining[0]?.id || null);
            }
        } catch (error) { console.error("Error deleting thread", error); }
    };

    const handleSendMessage = async (text: string) => {
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

            const aiMsg: Message = {
                id: data.message_id || `ai-${Date.now()}`,
                role: "assistant",
                content: data.content,
                status: data.status,
                toolName: data.tool_name,
                toolArgs: data.tool_args,
                toolCallId: data.tool_call_id,
                runId: data.run_id,
                createdAt: new Date(),
            };

            setMessages((prev) => [...prev, aiMsg]);
            setIsLoading(false); 
    
            if (isFirstMessage) await loadThreads();
    
        } catch (error) {
            if (activeConvoIdRef.current === activeConvoId) {
                setMessages((prev) => [...prev, { 
                    id: "err-"+Date.now(), role: "assistant", 
                    content: "Error: Could not get response.", createdAt: new Date() 
                }]);
            }
            setIsLoading(false);
        } 
    };

    const handleApprovalAction = async (action: "approve" | "reject", message: Message) => {
        if (!user || !activeConvoId || !message.runId || !message.toolCallId) return;
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: "action_taken" } : m));
        
        const tempId = "proc-" + Date.now();
        setMessages(prev => [...prev, {
            id: tempId, role: "assistant",
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
                    ...m, content: data.content, status: data.status, id: `resp-${Date.now()}`
                } : m
            ));
        } catch (error) { console.error("Approval Error", error); }
    };

    return (
        <div className="chat-tab flex h-full w-full">
            <aside className={`sidebar w-1/4 min-w-[16rem] flex flex-col ${isSidebarOpen ? 'open' : 'hidden md:flex'}`}>
                <div className="sidebar-header flex items-center justify-between px-4 py-3">
                    <h2 className="text-sm font-semibold">Conversations</h2>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={createNewConversation} 
                        className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md shadow-lg shadow-indigo-500/20"
                    >
                        <AddIcon fontSize="small" /> New
                    </motion.button>
                </div>
                
                <div className="conversations-list flex-1 overflow-y-auto px-2">
                    <AnimatePresence mode="wait">
                        {isThreadsLoading ? (
                            <motion.div 
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4 py-4"
                            >
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex flex-col gap-2 px-3">
                                        <div className="h-4 w-3/4 bg-gray-800/60 rounded overflow-hidden relative">
                                            <motion.div 
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"
                                                animate={{ x: ['-100%', '100%'] }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            />
                                        </div>
                                        <div className="h-3 w-1/2 bg-gray-800/40 rounded overflow-hidden relative">
                                            <motion.div 
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                                                animate={{ x: ['-100%', '100%'] }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.2 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : conversations.length === 0 ? (
                            <motion.p 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-gray-400 text-sm px-4 py-6 text-center"
                            >
                                No conversations yet
                            </motion.p>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ staggerChildren: 0.05 }}
                            >
                                {conversations.map((convo) => (
                                    <motion.div
                                        key={convo.id}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        whileHover={{ x: 4, backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                                        className={`conversation-item flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition mb-1 ${activeConvoId === convo.id ? "active" : ""}`}
                                        onClick={() => { setActiveConvoId(convo.id); setIsSidebarOpen(false); }}
                                    >
                                        <div className="conversation-content flex-1 min-w-0">
                                            <div className="conversation-title text-sm font-medium truncate">
                                                {formatConversationTitle(convo.title || "New Chat", activeConvoId === convo.id)}
                                            </div>
                                            <div className="conversation-meta text-xs opacity-60">{formatTimestamp(convo.updatedAt)}</div>
                                        </div>
                                        <motion.button 
                                            whileHover={{ scale: 1.2, color: "#f87171" }}
                                            className="delete-conversation-btn text-gray-500 ml-2"
                                            onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            <section className="chat-view flex-1 flex flex-col">
                {!activeConvoId ? (
                    <div className="no-conversation flex flex-col items-center justify-center flex-1 text-center space-y-4">
                        <ChatBubbleOutlineIcon style={{ fontSize: 48, color: 'var(--text-muted)' }} />
                        <h2 className="text-xl font-semibold">Fixie AI Support</h2>
                        <p className="text-gray-400 text-sm">Select or start a new chat to begin.</p>
                        <button onClick={createNewConversation} className="start-chat-btn flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-white text-sm">
                            <AddIcon fontSize="small" /> Start New Chat
                        </button>
                    </div>
                ) : (
                    <div className="chat-container flex flex-col flex-1 overflow-hidden">
                        {messages.length === 0 && !isLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }} 
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-6"
                                >
                                    <ChatBubbleOutlineIcon style={{ fontSize: 32, color: '#6366f1' }} />
                                </motion.div>
                                <h2 className="text-3xl font-bold mb-3 tracking-tight">How can I help you?</h2>
                                <p className="text-gray-400 max-w-md text-lg leading-relaxed">Describe your issue to start your session with Fixie.</p>
                            </div>
                        ) : (
                            <div className="chat-messages flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                                <div className="chat-spacer flex-1" /> 
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChatMessage message={msg} onApprovalAction={handleApprovalAction} />
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <div className="flex items-center gap-3 p-4">
                                        <div className="gemini-loader">
                                            <AutoAwesomeIcon sx={{ fontSize: 20, color: '#8EBBFF' }} className="animate-spin-slow" />
                                        </div>
                                        <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Fixie is thinking...</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                        
                        <div className="chat-input-area p-4">
                            <div className="modern-input-wrapper flex items-center gap-2 p-1.5 bg-gray-900 border border-white/10 rounded-xl focus-within:border-indigo-500/50 transition-all">
                                <input
                                    type="text"
                                    className="modern-input-field flex-1 bg-transparent border-none outline-none px-3 text-sm"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey && inputMessage.trim() && !isLoading) {
                                            handleSendMessage(inputMessage);
                                            setInputMessage("");
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    disabled={isLoading}
                                />
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="modern-send-btn p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:grayscale" 
                                    onClick={() => { handleSendMessage(inputMessage); setInputMessage(""); }} 
                                    disabled={!inputMessage.trim() || isLoading}
                                >
                                    <SendIcon fontSize="small" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ChatModule;