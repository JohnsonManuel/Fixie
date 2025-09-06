import React, { useEffect } from 'react';
import '../styles/EnterpriseITSM.css';
import fixieLogo from '../images/image.png';

interface EnterpriseITSMProps {
  onBackToHome: () => void;
}

const EnterpriseITSM: React.FC<EnterpriseITSMProps> = ({ onBackToHome }) => {
  useEffect(() => {
    document.title = 'Fixie.ai';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Enterprise-grade ITSM platform with AI automation. SOC2 compliant, global deployment, Fortune 500 security standards. Better than ServiceNow.');
    }
  }, []);

  return (
    <div className="enterprise-itsm-page">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div className="logo" onClick={onBackToHome}>
              <img src={fixieLogo} alt="Fixie.ai Logo" className="nav-logo" />
              <span className="logo-text">fixie.ai</span>
            </div>
          </div>
          <div className="nav-right">
            <button className="nav-btn-secondary" onClick={onBackToHome}>Back to Home</button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <header className="hero-section">
          <div className="container">
            <h1>Enterprise ITSM Platform Built for Global Scale</h1>
            <p className="hero-subtitle">
              AI-powered IT service management platform trusted by Fortune 500 companies worldwide. 
              Enterprise-grade security, compliance, and performance at global scale.
            </p>
          </div>
        </header>

        <section className="enterprise-features">
          <div className="container">
            <h2>Enterprise-Grade Capabilities</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>🔒 Enterprise Security</h3>
                <p>SOC2 Type II, ISO 27001, GDPR compliant with enterprise SSO integration</p>
              </div>
              <div className="feature-card">
                <h3>🌍 Global Deployment</h3>
                <p>Multi-region deployment with 99.9% uptime SLA and global data residency</p>
              </div>
              <div className="feature-card">
                <h3>📊 Enterprise Analytics</h3>
                <p>Advanced reporting, custom dashboards, and executive-level insights</p>
              </div>
              <div className="feature-card">
                <h3>🔧 API-First Architecture</h3>
                <p>RESTful APIs, webhooks, and enterprise integrations with existing systems</p>
              </div>
            </div>
          </div>
        </section>

        <section className="compliance-section">
          <div className="container">
            <h2>Enterprise Compliance & Security</h2>
            <div className="compliance-grid">
              <div className="compliance-item">
                <h3>SOC2 Type II</h3>
                <p>Audited security controls and data protection standards</p>
              </div>
              <div className="compliance-item">
                <h3>ISO 27001</h3>
                <p>International information security management certification</p>
              </div>
              <div className="compliance-item">
                <h3>GDPR Compliant</h3>
                <p>European data protection regulation compliance</p>
              </div>
              <div className="compliance-item">
                <h3>HIPAA Ready</h3>
                <p>Healthcare data protection standards support</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EnterpriseITSM;