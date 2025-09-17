import React from 'react';
import fixieLogo from '../images/image.png';

const FeaturesSection: React.FC = () => {
  return (
    <section className="features" id="features" aria-labelledby="features-heading">
      <div className="container">
        <div className="section-header">
          <img 
            src={fixieLogo} 
            alt="Fixie.ai platform features and capabilities" 
            className="section-logo"
            style={{ width: '48px', height: '48px', marginBottom: '16px' }}
            loading="lazy"
          />
          <h2 id="features-heading">Enterprise Features</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI-Powered Resolution Engine</h3>
            <p>Go beyond simple scripts; our AI understands context and user intent.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Seamless ITSM Integrations</h3>
            <p>Connect with ServiceNow, Jira Desk, Zendesk, Freshdesk, and others.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛠️</div>
            <h3>Agent Tool Calling</h3>
            <p>Perform real-time actions like system restarts, user provisioning, and software installation.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics & Reporting</h3>
            <p>See resolution times drop and user satisfaction soar.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;