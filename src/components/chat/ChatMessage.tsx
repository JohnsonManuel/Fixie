import React from 'react';
import fixieLogo from '../../images/favicon.png';

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
            {message.content.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
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
