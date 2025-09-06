import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import fixieLogo from '../../images/image.png';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: any;
  actions?: any[];
  tool_results?: any[];
}

interface ChatMessageProps {
  message: Message;
  onAction?: (action: any) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onAction }) => {
  const renderContent = () => {
    if (message.content) {
      return (
        <div className="message-content">
          <div className="message-text">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for markdown elements
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
                code: ({children}) => <code style={{
                  backgroundColor: '#f1f5f9',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                }}>{children}</code>,
                pre: ({children}) => <pre style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  border: '1px solid #e2e8f0',
                  margin: '16px 0'
                }}>{children}</pre>,
                blockquote: ({children}) => <blockquote style={{
                  borderLeft: '4px solid #1877F2',
                  paddingLeft: '16px',
                  margin: '16px 0',
                  fontStyle: 'italic',
                  color: '#4a5568'
                }}>{children}</blockquote>
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Tool call results */}
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

          {/* Action buttons */}
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
