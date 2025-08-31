import React, { useEffect } from 'react';
import '../styles/ServiceNowMigration.css';
import fixieLogo from '../images/favicon.png';

interface ServiceNowMigrationProps {
  onBackToHome: () => void;
}

const ServiceNowMigration: React.FC<ServiceNowMigrationProps> = ({ onBackToHome }) => {
  useEffect(() => {
    document.title = 'Fixie.ai';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Professional ServiceNow migration services. Zero-downtime migration to Fixie.ai with 60% cost savings. Enterprise migration specialists available.');
    }
  }, []);

  return (
    <div className="servicenow-migration-page">
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
            <h1>ServiceNow Migration Made Simple</h1>
            <p className="hero-subtitle">
              Professional migration services from ServiceNow to Fixie.ai. Zero downtime, 
              complete data integrity, and 60% cost reduction guaranteed.
            </p>
          </div>
        </header>

        <section className="migration-benefits">
          <div className="container">
            <h2>Why Migrate from ServiceNow?</h2>
            <div className="benefits-grid">
              <div className="benefit-card">
                <h3>💰 60% Cost Reduction</h3>
                <p>Eliminate complex licensing fees and reduce total cost of ownership significantly</p>
              </div>
              <div className="benefit-card">
                <h3>⚡ 90% Faster Implementation</h3>
                <p>Deploy in weeks, not months. Get value immediately with rapid implementation</p>
              </div>
              <div className="benefit-card">
                <h3>🤖 Superior AI Capabilities</h3>
                <p>Advanced AI that actually resolves tickets, not just routes them</p>
              </div>
              <div className="benefit-card">
                <h3>🔧 Simplified Management</h3>
                <p>Intuitive interface that doesn't require specialized ServiceNow expertise</p>
              </div>
            </div>
          </div>
        </section>

        <section className="migration-process">
          <div className="container">
            <h2>Our Proven Migration Process</h2>
            <div className="process-timeline">
              <div className="timeline-item">
                <div className="timeline-number">1</div>
                <div className="timeline-content">
                  <h3>Discovery & Assessment</h3>
                  <p>Comprehensive audit of your ServiceNow environment, workflows, and integrations</p>
                  <span className="timeline-duration">Week 1</span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-number">2</div>
                <div className="timeline-content">
                  <h3>Migration Planning</h3>
                  <p>Detailed migration strategy with risk assessment and rollback procedures</p>
                  <span className="timeline-duration">Week 2</span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-number">3</div>
                <div className="timeline-content">
                  <h3>Data Migration</h3>
                  <p>Secure transfer of all tickets, knowledge base, and historical data</p>
                  <span className="timeline-duration">Week 3-4</span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-number">4</div>
                <div className="timeline-content">
                  <h3>Go-Live & Support</h3>
                  <p>Seamless cutover with 24/7 support and user training</p>
                  <span className="timeline-duration">Week 5+</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="migration-guarantee">
          <div className="container">
            <h2>Migration Guarantee</h2>
            <div className="guarantee-content">
              <p>We guarantee zero data loss, minimal downtime, and complete functionality preservation during your ServiceNow migration. If you're not satisfied within 90 days, we'll migrate you back at no cost.</p>
              <button className="cta-primary">Start Your Migration Assessment</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ServiceNowMigration;