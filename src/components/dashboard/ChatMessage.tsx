import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import fixieLogo from '../../images/image.png';
import { Message } from '../../types'; 
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";

interface ChatMessageProps {
  message: Message;
  onApprovalAction?: (value: string, message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onApprovalAction }) => {
  const { user } = useAuth();
  const isUser = message.role === 'user';
  
  // Bridge potential snake_case from Python backend
  const toolName = message.toolName || (message as any).tool_name;
  const toolArgs = message.toolArgs || (message as any).tool_args;

  // --- STREAMLINED LOGIC ---
  const isAwaitingAction = !isUser && message.status === 'requires_action';
  const isProcessing = message.status === 'processing' || message.status === 'action_taken';
  const isCompleted = message.status === 'completed';
  
  const shouldShowApprovalCard = (isAwaitingAction || isProcessing) && !isCompleted;

  // Determine the display title based on the "type" sent from the graph
  const getHeaderTitle = () => {
    if (toolName === 'selection') return "Service Selection";
    if (toolName === 'confirmation') return "Approval Required";
    return "System Action";
  };

  const renderToolArgs = (args: any) => {
    return (
      <div className="flex flex-col">
        <span className="text-[9px] uppercase text-indigo-400 font-black tracking-widest mb-1">
          {getHeaderTitle()}
        </span>
        <span className="text-xs text-gray-200 leading-tight">
          {args?.message || "Please select an option to proceed:"}
        </span>
        
        {/* Render extra metadata if provided in 'details' */}
        {args?.details && typeof args.details === 'object' && (
          <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
            {Object.entries(args.details).map(([key, val]) => (
              <div key={key} className="text-[10px] text-gray-400 truncate">
                <span className="opacity-60 uppercase">{key.replace(/_/g, ' ')}:</span> {String(val)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: isUser ? 10 : -10 }} 
      animate={{ opacity: 1, x: 0 }}
      className="w-full flex gap-3 items-start mb-4 px-2"
      style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}
    >
      <div className="flex-shrink-0 mt-1">
        <div style={{ 
            width: '32px', height: '32px', borderRadius: '50%', 
            backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            border: isUser ? 'none' : '1px solid var(--border-primary)'
        }}>
          {isUser ? (
            <span className="text-[10px] font-bold text-white uppercase">
              {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2) : 'ME'}
            </span>
          ) : (
            <img src={fixieLogo} alt="Fixie Assistant" className="w-full h-full object-cover" />
          )}
        </div>
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
        {message.content && (
            <div style={{ 
              maxWidth: '90%', width: 'fit-content', padding: '12px 16px',
              backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: isUser ? '#fff' : 'var(--text-primary)',
              borderRadius: isUser ? '18px 2px 18px 18px' : '2px 18px 18px 18px',
              boxShadow: 'var(--shadow-sm)',
              border: isUser ? 'none' : '1px solid var(--border-primary)',
              marginBottom: shouldShowApprovalCard ? '12px' : '0'
            }}>
                <div className="markdown-container prose prose-sm max-w-none text-inherit leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                    </ReactMarkdown>
                </div>
            </div>
        )}

        <AnimatePresence mode="wait">
            {shouldShowApprovalCard && (
              <motion.div 
                key="approval-card"
                initial={{ opacity: 0, height: 0, scale: 0.95 }} 
                animate={{ opacity: 1, height: 'auto', scale: 1 }} 
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="w-full max-w-sm bg-[#1a1b1e] border border-indigo-500/30 p-4 rounded-2xl shadow-2xl relative overflow-hidden"
              >
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                 
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className={`flex h-2 w-2 rounded-full ${isProcessing ? 'bg-indigo-500 animate-spin' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-[11px] font-black uppercase tracking-tighter text-gray-300">
                            {getHeaderTitle()}
                        </span>
                    </div>
                 </div>

                 <div className="bg-black/30 backdrop-blur-sm p-3 rounded-xl mb-4 border border-white/5 shadow-inner">
                    {renderToolArgs(toolArgs)}
                 </div>

                 <div className="flex flex-col gap-2">
                    <AnimatePresence mode="wait">
                        {isProcessing ? (
                            <motion.div 
                                key="processing"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="w-full py-2.5 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 border border-indigo-500/20"
                            >
                                <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </motion.div>
                        ) : (
                            <motion.div key="buttons" className="flex flex-col w-full gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {/* GENERIC OPTIONS LOOP: 
                                   This maps over the options array sent from the graph 
                                */}
                                {toolArgs?.options?.map((option: string) => (
                                    <button 
                                        key={option}
                                        onClick={() => onApprovalAction?.(option, message)} 
                                        className={`w-full text-xs font-bold py-3 rounded-xl transition-all flex justify-between items-center px-4 group
                                          ${option.toLowerCase() === 'reject' || option.toLowerCase() === 'deny'
                                            ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10' 
                                            : 'bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-white'
                                          }`}
                                    >
                                        <span className="capitalize">{option.replace(/_/g, ' ')}</span>
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black">
                                          {option.toLowerCase() === 'reject' || option.toLowerCase() === 'deny' ? '✕' : 'SELECT →'}
                                        </span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </div>
              </motion.div>
            )}
        </AnimatePresence>
        
        <span className="text-[9px] opacity-30 mt-1 font-bold tracking-widest uppercase px-1">
            {isUser ? 'You' : 'Fixie AI'} • {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
        </span>
      </div>
    </motion.div>
  );
};

export default ChatMessage;