import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import fixieLogo from '../../images/image.png';
import { Message } from '../../types'; 
import { motion } from "framer-motion";

interface ChatMessageProps {
  message: Message;
  onApprovalAction?: (action: "approve" | "reject", message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onApprovalAction }) => {
  const isUser = message.role === 'user';

  const renderToolArgs = (args: Record<string, any>) => (
    Object.entries(args).map(([key, value]) => (
      <div key={key} className="flex flex-col mb-1.5">
        <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{key}</span>
        <span className="text-xs text-white font-mono break-all">{String(value)}</span>
      </div>
    ))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: isUser ? 10 : -10 }} 
      animate={{ opacity: 1, x: 0 }}
      style={{ 
        display: 'flex', gap: '10px', width: '100%', 
        flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' 
      }}
    >
      {/* Circle Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div style={{ 
            width: '32px', height: '32px', borderRadius: '50%', 
            backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            border: isUser ? 'none' : '1px solid var(--border-primary)'
        }}>
          {isUser ? (
            <span className="text-[10px] font-bold text-white">ME</span>
          ) : (
            <img src={fixieLogo} alt="Fixie AI Assistant" className="w-full h-full object-cover" />
          )}
        </div>
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
        {/* Pointer Bubble - Top Aligned */}
        <div style={{ 
          maxWidth: '95%', width: 'fit-content', padding: '10px 14px',
          backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)',
          color: isUser ? '#fff' : 'var(--text-primary)',
          borderRadius: isUser ? '16px 0px 16px 16px' : '0px 16px 16px 16px',
          boxShadow: 'var(--shadow-sm)',
          border: isUser ? 'none' : '1px solid var(--border-primary)'
        }}>
          {/* Fixed ReactMarkdown: className moved to wrapper div */}
          <div className="markdown-container prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || "**Requesting Permission...**"}
            </ReactMarkdown>
          </div>
        </div>

        {/* Approval UI */}
        {!isUser && message.status === 'requires_action' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 w-full max-w-sm bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-xl">
             <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-200">
                <span className="text-yellow-400">⚡</span> {message.toolName}
             </div>
             <div className="bg-gray-900 p-3 rounded-lg mb-4 border border-gray-700">
                {message.toolArgs && renderToolArgs(message.toolArgs)}
             </div>
             <div className="flex gap-2">
                <button onClick={() => onApprovalAction?.("approve", message)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">Approve</button>
                <button onClick={() => onApprovalAction?.("reject", message)} className="flex-1 border border-red-500 text-red-500 text-xs font-bold py-2 rounded-lg hover:bg-red-500/10">Reject</button>
             </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;