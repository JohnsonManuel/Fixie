import React, { useEffect } from 'react';
import '../../styles/ServiceNowAlternative.css';
import fixieLogo from '../../images/image.png';

interface ServiceNowAlternativeProps {
  onBackToHome: () => void;
}

const ServiceNowAlternative: React.FC<ServiceNowAlternativeProps> = ({ onBackToHome }) => {
  useEffect(() => {
    document.title = 'Fixie.ai';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Leading ServiceNow alternative with AI automation. 90% faster deployment, 60% cost reduction. Trusted by Fortune 500 companies for enterprise ITSM.');
    }
  }, []);

  return (
    <div className="servicenow-alternative-page">
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
            <h1>The #1 ServiceNow Alternative for Enterprise ITSM</h1>
            <p className="hero-subtitle">
              Why Fortune 500 companies are migrating from ServiceNow to Fixie.ai for faster, smarter, and more cost-effective IT service management.
            </p>
          </div>
        </header>

        <section className="comparison-section">
          <div className="container">
            <h2>ServiceNow vs Fixie.ai: Enterprise Comparison</h2>
            <div className="comparison-table">
              <div className="comparison-row header">
                <div className="feature">Feature</div>
                <div className="servicenow">ServiceNow</div>
                <div className="fixie">Fixie.ai</div>
              </div>
              <div className="comparison-row">
                <div className="feature">AI-Powered Resolution</div>
                <div className="servicenow">Limited AI capabilities</div>
                <div className="fixie">Advanced AI with 95% accuracy</div>
              </div>
              <div className="comparison-row">
                <div className="feature">Implementation Time</div>
                <div className="servicenow">6-18 months</div>
                <div className="fixie">2-4 weeks (90% faster)</div>
              </div>
              <div className="comparison-row">
                <div className="feature">Total Cost of Ownership</div>
                <div className="servicenow">$500K+ annually</div>
                <div className="fixie">60% cost reduction</div>
              </div>
              <div className="comparison-row">
                <div className="feature">Global Deployment</div>
                <div className="servicenow">Complex multi-instance</div>
                <div className="fixie">Single global platform</div>
              </div>
            </div>
          </div>
        </section>

        <section className="migration-section">
          <div className="container">
            <h2>Seamless ServiceNow Migration</h2>
            <div className="migration-steps">
              <div className="step">
                <h3>1. Assessment & Planning</h3>
                <p>Comprehensive analysis of your ServiceNow environment and migration strategy.</p>
              </div>
              <div className="step">
                <h3>2. Data Migration</h3>
                <p>Secure transfer of tickets, workflows, and historical data with zero downtime.</p>
              </div>
              <div className="step">
                <h3>3. Team Training</h3>
                <p>Enterprise-grade training for IT teams and end users on the new platform.</p>
              </div>
              <div className="step">
                <h3>4. Go-Live Support</h3>
                <p>24/7 support during transition with dedicated enterprise success manager.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ServiceNowAlternative;