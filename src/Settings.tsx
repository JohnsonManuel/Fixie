import React, { useState, useEffect } from 'react';
import './Settings.css';
import { useAuth } from './hooks/useAuth';
import { db } from './firebase';
import { doc, deleteDoc, onSnapshot } from 'firebase/firestore';

interface SettingsProps {
  onBackToDashboard?: () => void;
}

interface JiraConnection {
  status: 'connecting' | 'connected' | 'failed';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  availableProjects?: any[];
  defaultProject?: any;
  connectedAt?: Date;
  updatedAt?: Date;
  reason?: string;
}

function Settings({ onBackToDashboard }: SettingsProps) {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'not_connected' | 'connected' | 'failed'>('not_connected');
  const [connectionDetails, setConnectionDetails] = useState<JiraConnection | null>(null);

  // Check Jira connection status
  useEffect(() => {
    if (!user?.uid) return;

    setIsLoading(true);
    const connectionRef = doc(db, "users", user.uid, "platform-connections", "jira");
    
    const unsubscribe = onSnapshot(connectionRef, (doc) => {
      setIsLoading(false);
      if (doc.exists()) {
        const data = doc.data() as JiraConnection;
        setConnectionDetails(data);
        
        // Handle different status values
        switch (data.status) {
          case 'connected':
            setConnectionStatus('connected');
            break;
          case 'failed':
            setConnectionStatus('failed');
            break;
          case 'connecting':
            setConnectionStatus('not_connected'); // Show as not connected while connecting
            break;
          default:
            setConnectionStatus('not_connected');
        }
      } else {
        setConnectionStatus('not_connected');
        setConnectionDetails(null);
      }
    }, (error) => {
      console.error('Error listening to Jira connection:', error);
      setIsLoading(false);
      setConnectionStatus('not_connected');
      setConnectionDetails(null);
    });

    return () => unsubscribe();
  }, [user]);

  const handleJiraOAuth = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    try {
      // Get the current conversation ID (or create a new one for settings)
      const conversationId = 'settings-connection';
      
      // Build OAuth URL
      const oauthUrl = `https://europe-west10-jj-ai-platform.cloudfunctions.net/jiraOAuthStart?idToken=${await user.getIdToken()}&conversationId=${conversationId}`;
      
      // Open OAuth popup
      const popup = window.open(oauthUrl, 'jira_oauth', 'width=600,height=700');
      
      if (!popup) {
        window.alert('Please allow popups to connect to Jira');
        setIsConnecting(false);
        return;
      }

      // Listen for OAuth completion message
      const messageHandler = (event: MessageEvent) => {
        // Only accept messages from our OAuth popup
        if (event.origin !== 'https://europe-west10-jj-ai-platform.cloudfunctions.net') {
          return;
        }
        
        if (event.data?.type === 'jira_connected') {
          popup.close();
          window.removeEventListener('message', messageHandler);
          setIsConnecting(false);
          
          // Refresh connection status
          if (event.data.success) {
            setConnectionStatus('connected');
            // Force a refresh of the connection data
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            setConnectionStatus('failed');
            window.alert('Jira connection failed. Please try again.');
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          setIsConnecting(false);
        }
      }, 1000);

      // Set a timeout for the OAuth process
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          window.removeEventListener('message', messageHandler);
          setIsConnecting(false);
          window.alert('OAuth connection timed out. Please try again.');
        }
      }, 300000); // 5 minutes timeout

    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      setIsConnecting(false);
      window.alert('Failed to start Jira connection. Please try again.');
    }
  };

  const handleDisconnectJira = async () => {
    if (!user || !window.confirm('Are you sure you want to disconnect from Jira? This will remove your access to ticket creation.')) {
      return;
    }

    try {
      // Remove Jira connection from Firestore
      const connectionRef = doc(db, "users", user.uid, "platform-connections", "jira");
      await deleteDoc(connectionRef);
      
      setConnectionStatus('not_connected');
      setConnectionDetails(null);
    } catch (error) {
      console.error('Error disconnecting from Jira:', error);
      window.alert('Failed to disconnect from Jira. Please try again.');
    }
  };

  const getStatusBadge = () => {
    if (isLoading) {
      return <span className="status-badge loading">Loading...</span>;
    }
    
    switch (connectionStatus) {
      case 'connected':
        return <span className="status-badge connected">Connected</span>;
      case 'failed':
        return <span className="status-badge failed">Connection Failed</span>;
      default:
        return <span className="status-badge disconnected">Not Connected</span>;
    }
  };

  const getConnectionInfo = () => {
    if (!connectionDetails || connectionStatus !== 'connected') return null;

    // Helper function to safely convert Firestore timestamp
    const formatTimestamp = (timestamp: any) => {
      if (!timestamp) return 'Unknown';
      
      try {
        // Handle both Firestore Timestamp and Date objects
        if (timestamp.seconds) {
          return new Date(timestamp.seconds * 1000).toLocaleDateString();
        } else if (timestamp.toDate) {
          return timestamp.toDate().toLocaleDateString();
        } else if (timestamp instanceof Date) {
          return timestamp.toLocaleDateString();
        }
        return 'Unknown';
      } catch (error) {
        console.error('Error formatting timestamp:', error);
        return 'Unknown';
      }
    };

    return (
      <div className="connection-details">
        <h3>Connection Details:</h3>
        <div className="detail-item">
          <strong>Status:</strong> {connectionDetails.status}
        </div>
        <div className="detail-item">
          <strong>Connected:</strong> {formatTimestamp(connectionDetails.connectedAt)}
        </div>
        <div className="detail-item">
          <strong>Projects:</strong> {connectionDetails.availableProjects?.length || 0} available
        </div>
        {connectionDetails.defaultProject && (
          <div className="detail-item">
            <strong>Default Project:</strong> {connectionDetails.defaultProject.name}
          </div>
        )}
        {connectionDetails.updatedAt && (
          <div className="detail-item">
            <strong>Last Updated:</strong> {formatTimestamp(connectionDetails.updatedAt)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="settings-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div className="logo">
              <span className="logo-text">Fixie</span>
            </div>
          </div>
          <div className="nav-right">
            <button onClick={onBackToDashboard} className="back-link">← Back to Dashboard</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Connect your Jira account to enable automatic ticket creation</p>
        </div>

        <div className="settings-section">
          <div className="jira-connection-card">
            <div className="connection-header">
              <span className="platform-icon">🟢</span>
              <div className="connection-info">
                <h2>Jira Service Management</h2>
                <p>Connect your Jira account to enable automatic ticket creation when AI cannot solve issues.</p>
              </div>
            </div>
            
            <div className="connection-status">
              {getStatusBadge()}
            </div>
            
            <div className="connection-actions">
              {connectionStatus === 'connected' ? (
                <button 
                  className="btn-secondary disconnect-btn"
                  onClick={handleDisconnectJira}
                  disabled={isLoading}
                >
                  ❌ Disconnect from Jira
                </button>
              ) : (
                <button 
                  className="btn-primary oauth-btn"
                  onClick={handleJiraOAuth}
                  disabled={isConnecting || isLoading}
                >
                  {isConnecting ? 'Connecting...' : '🔐 Connect to Jira'}
                </button>
              )}
            </div>
            
            {getConnectionInfo()}
            
            <div className="connection-benefits">
              <h3>Benefits of connecting:</h3>
              <ul>
                <li>✅ <strong>Automatic ticket creation</strong> when AI cannot solve issues</li>
                <li>✅ <strong>Seamless escalation</strong> from AI support to human teams</li>
                <li>✅ <strong>Full context preservation</strong> in tickets</li>
                <li>✅ <strong>One-click connection</strong> via OAuth (no API keys needed)</li>
                <li>✅ <strong>Secure token storage</strong> in Firebase</li>
                <li>✅ <strong>Automatic token refresh</strong> when needed</li>
              </ul>
            </div>

            {connectionStatus === 'failed' && (
              <div className="connection-error">
                <h3>⚠️ Connection Failed</h3>
                <p>Your previous Jira connection attempt failed. You can try connecting again, or contact support if the issue persists.</p>
                <p><strong>Error:</strong> {connectionDetails?.reason || 'Unknown error'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
