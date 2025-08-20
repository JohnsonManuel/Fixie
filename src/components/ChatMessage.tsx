import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    actions?: any[];
    tool_calls?: any[];
    tool_results?: any[];
  };
  onAction?: (action: any) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onAction }) => {
  const codeBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (codeBlockRef.current) {
      Prism.highlightAllUnder(codeBlockRef.current);
    }
  }, [message.content]);

  const renderContent = () => {
    if (message.role === 'user') {
      return (
        <div className="message-content user-message">
          {message.content}
        </div>
      );
    }

    if (message.role === 'assistant') {
      return (
        <div className="message-content assistant-message" ref={codeBlockRef}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom code block rendering with syntax highlighting
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
              blockquote: ({ children }) => (
                <blockquote className="message-blockquote">
                  {children}
                </blockquote>
              ),
              // Custom table rendering
              table: ({ children }) => (
                <div className="table-wrapper">
                  <table className="message-table">
                    {children}
                  </table>
                </div>
              ),
              // Custom list rendering
              ul: ({ children }) => (
                <ul className="message-list">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="message-list">
                  {children}
                </ol>
              ),
              // Custom link rendering
              a: ({ href, children }) => (
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
        {message.role === 'user' ? '👤' : '🤖'}
      </div>
      {renderContent()}
    </div>
  );
};

export default ChatMessage;
