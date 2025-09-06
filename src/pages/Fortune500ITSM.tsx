import React, { useEffect } from 'react';
import '../styles/Fortune500ITSM.css';
import fixieLogo from '../images/image.png';

interface Fortune500ITSMProps {
  onBackToHome: () => void;
}

const Fortune500ITSM: React.FC<Fortune500ITSMProps> = ({ onBackToHome }) => {
  useEffect(() => {
    document.title = 'Fixie.ai';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'ITSM platform trusted by Fortune 500 companies. Enterprise-grade AI service management with global scale, security, and compliance standards.');
    }
  }, []);

  return (
    <div className="fortune500-itsm-page">
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
            <h1>Trusted by Fortune 500 Companies Worldwide</h1>
            <p className="hero-subtitle">
              The only ITSM platform that meets Fortune 500 standards for security, scale, 
              and performance. Join global enterprises who've chosen Fixie.ai over ServiceNow.
            </p>
          </div>
        </header>

        <section className="enterprise-stats">
          <div className="container">
            <h2>Fortune 500 Performance Metrics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Enterprise Uptime SLA</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">85%</div>
                <div className="stat-label">Ticket Volume Reduction</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">10x</div>
                <div className="stat-label">Faster Resolution Times</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">60%</div>
                <div className="stat-label">Cost Savings vs ServiceNow</div>
              </div>
            </div>
          </div>
        </section>

        <section className="enterprise-requirements">
          <div className="container">
            <h2>Meeting Fortune 500 Requirements</h2>
            <div className="requirements-grid">
              <div className="requirement-card">
                <h3>🏢 Global Scale</h3>
                <p>Multi-region deployment supporting 100,000+ users across continents</p>
              </div>
              <div className="requirement-card">
                <h3>🔐 Enterprise Security</h3>
                <p>SOC2, ISO 27001, FedRAMP compliance with zero-trust architecture</p>
              </div>
              <div className="requirement-card">
                <h3>📈 Performance at Scale</h3>
                <p>Sub-second response times even with millions of tickets and users</p>
              </div>
              <div className="requirement-card">
                <h3>🔄 Business Continuity</h3>
                <p>99.9% uptime SLA with disaster recovery and business continuity planning</p>
              </div>
            </div>
          </div>
        </section>

        <section className="case-studies">
          <div className="container">
            <h2>Fortune 500 Success Stories</h2>
            <div className="case-study-grid">
              <div className="case-study">
                <h3>Global Technology Company</h3>
                <p>"Migrated from ServiceNow to Fixie.ai and reduced IT support costs by 65% while improving resolution times by 80%."</p>
                <div className="case-metrics">
                  <span>150,000 employees</span>
                  <span>65% cost reduction</span>
                  <span>80% faster resolution</span>
                </div>
              </div>
              <div className="case-study">
                <h3>Fortune 100 Financial Services</h3>
                <p>"Fixie.ai's AI capabilities resolved 90% of our tickets automatically, freeing our IT team for strategic initiatives."</p>
                <div className="case-metrics">
                  <span>200,000 employees</span>
                  <span>90% automation rate</span>
                  <span>6-month ROI</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="enterprise-cta">
          <div className="container">
            <h2>Ready for Fortune 500 Scale?</h2>
            <p>Join the global enterprises who've chosen Fixie.ai for their ITSM needs.</p>
            <button className="cta-primary">Schedule Enterprise Demo</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Fortune500ITSM;