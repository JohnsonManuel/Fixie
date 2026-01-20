import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import fixieLogo from '../../images/image.png';
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

  // Helper to render tool arguments (Original clean look)
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
                p: ({children}) => <p style={{margin: '8px 0', lineHeight: '1.7'}}>{children}</p>,
                code: ({children}) => <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9em', color: '#333' }}>{children}</code>,
                pre: ({children}) => <pre style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', overflow: 'auto', border: '1px solid #e2e8f0', margin: '16px 0' }}>{children}</pre>,
              }}
            >
              {message.content || (message.status === 'requires_action' ? "**I need your approval to proceed with the following request:**" : "")}
            </ReactMarkdown>
          </div>

          {/* 2. APPROVAL CARD */}
          {message.status === 'requires_action' && message.toolArgs && (
            <div className="tool-approval-card" style={{
              marginTop: '12px',
              backgroundColor: 'rgba(31, 41, 55, 0.95)',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', color: '#e5e7eb', fontWeight: 600 }}>
                <span style={{ marginRight: '8px' }}>⚡</span> 
                Request: {message.toolName}
              </div>
              
              <div style={{
                backgroundColor: '#111827',
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
                  style={{ flex: 1, backgroundColor: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                >
                  ✓ Approve
                </button>
                <button 
                  onClick={() => onApprovalAction?.("reject", message)}
                  style={{ flex: 1, backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          )}

          {/* 3. POST-ACTION FEEDBACK */}
          {message.status === 'action_taken' && (
             <div style={{ marginTop: '10px', color: '#9ca3af', fontSize: '0.85em', fontStyle: 'italic' }}>
                ✓ Decision recorded. Processing...
             </div>
          )}

          {/* 4. TOOL RESULTS */}
          {message.tool_results && message.tool_results.length > 0 && (
            <div className="tool-results">
              {message.tool_results.map((result, index) => (
                <div key={index} className="tool-result">
                  <div className="tool-result-header">
                    <span className="tool-result-icon">🔧</span>
                    <span className="tool-result-name">{result.tool_name}</span>
                  </div>
                  <div className="tool-result-content">{result.result}</div>
                </div>
              ))}
            </div>
          )}

          {/* 5. INTERACTIVE BUTTONS */}
          {message.interactive?.buttons && (
            <div className="interactive-buttons">
              <div className="button-group">
                {message.interactive.buttons.map((button) => (
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

          {/* 6. LEGACY ACTIONS */}
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
            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
          />
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default ChatMessage;