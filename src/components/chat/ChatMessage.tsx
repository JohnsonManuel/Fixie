import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import fixieLogo from '../../images/image.png';
import { Message } from '../../types'; 
import { motion } from "framer-motion";

interface ChatMessageProps {
  message: Message;
  onAction?: (action: any) => void;
  onButtonClick?: (buttonAction: string, messageId: string) => void;
  onApprovalAction?: (action: "approve" | "reject", message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onAction, 
  onButtonClick, 
  onApprovalAction 
}) => {

  const isUser = message.role === 'user';

  const renderToolArgs = (args: Record<string, any>) => {
    if (!args) return null;
    return Object.entries(args).map(([key, value]) => (
      <div key={key} className="tool-arg-row" style={{ display: 'flex', flexDirection: 'column', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.7em', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', fontWeight: 600 }}>
          {key}
        </span>
        <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.85em', wordBreak: 'break-all' }}>
          {String(value)}
        </span>
      </div>
    ));
  };

  const renderContent = () => {
    if (message.content || message.status === 'requires_action' || message.status === 'action_taken') {
      return (
        <div className="message-content" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: isUser ? 'flex-end' : 'flex-start',
            flex: 1, 
            minWidth: 0 
        }}>
          
          {/* 1. MAIN TEXT BUBBLE */}
          <div className="message-text" style={{ 
            maxWidth: '95%', 
            width: 'fit-content',
            padding: '12px 18px',
            backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: isUser ? '#ffffff' : 'var(--text-primary)',
            
            /* Pointer at the Top Logic:
               User (Right): Top-Right is 0 (square)
               Assistant (Left): Top-Left is 0 (square) */
            borderRadius: isUser ? '18px 0px 18px 18px' : '0px 18px 18px 18px',
            
            border: isUser ? 'none' : '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative'
          }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => <h1 style={{fontSize: '1.2rem', margin: '12px 0 8px 0', fontWeight: 700}}>{children}</h1>,
                h2: ({children}) => <h2 style={{fontSize: '1rem', margin: '12px 0 8px 0', fontWeight: 700}}>{children}</h2>,
                p: ({children}) => <p style={{margin: '6px 0', lineHeight: '1.6', fontSize: '0.925rem'}}>{children}</p>,
                code: ({children}) => (
                    <code style={{ 
                        backgroundColor: isUser ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)', 
                        padding: '2px 5px', 
                        borderRadius: '4px', 
                        fontFamily: 'monospace', 
                        fontSize: '0.85em' 
                    }}>
                        {children}
                    </code>
                ),
                pre: ({children}) => (
                    <pre style={{ 
                        backgroundColor: isUser ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)', 
                        padding: '12px', 
                        borderRadius: '10px', 
                        overflow: 'auto', 
                        margin: '12px 0',
                        fontSize: '0.825em',
                        border: isUser ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
                    }}>
                        {children}
                    </pre>
                ),
              }}
            >
              {message.content || (message.status === 'requires_action' ? "**I need your approval to proceed with the following request:**" : "")}
            </ReactMarkdown>
          </div>

          {/* 2. APPROVAL CARD (Only for Assistant) */}
          {!isUser && message.status === 'requires_action' && message.toolArgs && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="tool-approval-card" 
              style={{
                marginTop: '10px',
                width: '100%',
                maxWidth: '420px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem' }}>
                <span style={{ marginRight: '8px' }}>⚡</span> 
                {message.toolName}
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #334155' }}>
                {renderToolArgs(message.toolArgs)}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: '#059669' }} whileTap={{ scale: 0.98 }}
                  onClick={() => onApprovalAction?.("approve", message)}
                  style={{ flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  Approve
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }} whileTap={{ scale: 0.98 }}
                  onClick={() => onApprovalAction?.("reject", message)}
                  style={{ flex: 1, backgroundColor: 'transparent', color: '#f87171', border: '1px solid #f87171', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  Reject
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: isUser ? 15 : -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 120 }}
      style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px', 
        width: '100%',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start'
      }}
    >
      {/* Circle Avatar Section */}
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        {isUser ? (
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '50%', 
            backgroundColor: 'var(--accent-primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)'
          }}>
            ME
          </div>
        ) : (
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', 
            border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src={fixieLogo} alt="Fixie AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {renderContent()}
    </motion.div>
  );
};

export default ChatMessage;