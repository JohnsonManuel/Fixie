import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import fixieLogo from '../../images/image.png';

// CHANGE 1: Import the Message type instead of defining it locally
import { Message } from '../../types'; 

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

  // Helper to render tool arguments cleanly
  const renderToolArgs = (args: Record<string, any>) => {
    if (!args) return null;
    return Object.entries(args).map(([key, value]) => (
      <div key={key} className="tool-arg-row" style={{ display: 'flex', flexDirection: 'column', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.75em', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em' }}>
          {key}:
        </span>
        <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.9em' }}>
          {String(value)}
        </span>
      </div>
    ));
  };

  const renderContent = () => {
    // We render if there is content OR if an action is required (interrupt)
    if (message.content || message.status === 'requires_action' || message.status === 'action_taken') {
      return (
        <div className="message-content">
          
          {/* 1. MAIN TEXT CONTENT */}
          <div className="message-text">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => <h1 style={{fontSize: '26px', margin: '20px 0 12px 0', fontWeight: 600}}>{children}</h1>,
                h2: ({children}) => <h2 style={{fontSize: '22px', margin: '20px 0 12px 0', fontWeight: 600}}>{children}</h2>,
                h3: ({children}) => <h3 style={{fontSize: '20px', margin: '20px 0 12px 0', fontWeight: 600}}>{children}</h3>,
                h4: ({children}) => <h4 style={{fontSize: '18px', margin: '20px 0 12px 0', fontWeight: 600}}>{children}</h4>,
                p: ({children}) => <p style={{margin: '16px 0', lineHeight: '1.7'}}>{children}</p>,
                ul: ({children}) => <ul style={{margin: '16px 0', paddingLeft: '20px'}}>{children}</ul>,
                ol: ({children}) => <ol style={{margin: '16px 0', paddingLeft: '20px'}}>{children}</ol>,
                li: ({children}) => <li style={{margin: '8px 0', lineHeight: '1.6'}}>{children}</li>,
                strong: ({children}) => <strong style={{fontWeight: 600}}>{children}</strong>,
                em: ({children}) => <em style={{fontStyle: 'italic'}}>{children}</em>,
                code: ({children}) => <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9em', color: '#333' }}>{children}</code>,
                pre: ({children}) => <pre style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', overflow: 'auto', border: '1px solid #e2e8f0', margin: '16px 0' }}>{children}</pre>,
                blockquote: ({children}) => <blockquote style={{ borderLeft: '4px solid #1877F2', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#4a5568' }}>{children}</blockquote>
              }}
            >
              {message.content || (message.status === 'requires_action' ? "**I need your approval to proceed with the following request:**" : "")}
            </ReactMarkdown>
          </div>

          {/* 2. NEW: APPROVAL CARD (Interrupt) */}
          {message.status === 'requires_action' && message.toolArgs && (
            <div className="tool-approval-card" style={{
              marginTop: '12px',
              backgroundColor: 'rgba(31, 41, 55, 0.95)', // Dark gray
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '16px',
              maxWidth: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', color: '#e5e7eb', fontWeight: 600 }}>
                <span style={{ marginRight: '8px' }}>⚡</span> 
                Request: {message.toolName}
              </div>
              
              <div style={{
                backgroundColor: '#111827', // Black/Darker gray
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                border: '1px solid #374151'
              }}>
                {renderToolArgs(message.toolArgs)}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => onApprovalAction?.("approve", message)}
                  style={{
                    flex: 1,
                    backgroundColor: '#059669', // Green
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>✓</span> Approve
                </button>
                <button 
                  onClick={() => onApprovalAction?.("reject", message)}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    color: '#ef4444', // Red
                    border: '1px solid #ef4444',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>✕</span> Reject
                </button>
              </div>
            </div>
          )}

          {/* 3. NEW: POST-ACTION FEEDBACK */}
          {message.status === 'action_taken' && (
             <div style={{
               marginTop: '10px',
               paddingTop: '10px',
               borderTop: '1px solid rgba(255,255,255,0.1)',
               color: '#9ca3af',
               fontSize: '0.85em',
               fontStyle: 'italic'
             }}>
               ✓ Decision recorded. Processing...
             </div>
          )}

          {/* 4. EXISTING: Tool call results */}
          {message.tool_results && message.tool_results.length > 0 && (
            <div className="tool-results">
              {message.tool_results.map((result, index) => (
                <div key={index} className="tool-result">
                  <div className="tool-result-header">
                    <span className="tool-result-icon">🔧</span>
                    <span className="tool-result-name">{result.tool_name}</span>
                  </div>
                  <div className="tool-result-content">
                    {result.result}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. EXISTING: Interactive buttons */}
          {message.interactive && message.interactive.buttons && (
            <div className="interactive-buttons">
              <div className="button-group">
                {message.interactive.buttons.map((button, index) => (
                  <button
                    key={button.id}
                    className={`interactive-btn ${button.style || 'secondary'}`}
                    onClick={() => onButtonClick?.(button.action, message.id)}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. EXISTING: Legacy action buttons */}
          {message.actions && message.actions.length > 0 && (
            <div className="message-actions">
              {message.actions.map((action, index) => (
                <button
                  key={index}
                  className={`action-btn ${action.primary ? 'primary' : 'secondary'}`}
                  onClick={() => onAction?.(action)}
                >
                  {action.text}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`message ${message.role}`}>
      <div className="message-avatar">
        {message.role === 'user' ? '👤' : (
          <img 
            src={fixieLogo} 
            alt="Fixie AI" 
            className="fixie-avatar"
            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
          />
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default ChatMessage;