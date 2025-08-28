import React from 'react';
import ReactMarkdown from 'react-markdown';
import fixieLogo from '../../images/fixie-logo.png';

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
          <ReactMarkdown
            components={{
              // Custom code block rendering
              code: ({ className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const isInline = !className || !className.includes('language-');
                
                if (isInline) {
                  return (
                    <code className="inline-code" {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <div className="code-block-wrapper">
                    {language && (
                      <div className="code-language-badge">
                        {language}
                      </div>
                    )}
                    <pre className={`code-block ${className || ''}`}>
                      <code className={`language-${language}`} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                );
              },
              // Custom blockquote rendering
              blockquote: ({ children }: any) => (
                <blockquote className="message-blockquote">
                  {children}
                </blockquote>
              ),
              // Custom table rendering
              table: ({ children }: any) => (
                <div className="table-wrapper">
                  <table className="message-table">
                    {children}
                  </table>
                </div>
              ),
              // Custom list rendering
              ul: ({ children }: any) => (
                <ul className="message-list">
                  {children}
                </ul>
              ),
              ol: ({ children }: any) => (
                <ol className="message-list">
                  {children}
                </ol>
              ),
              // Custom link rendering
              a: ({ href, children }: any) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="message-link">
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>

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
