import React from 'react';
import fixieLogo from '../images/image.png';

interface HeroSectionProps {
  onDemoClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onDemoClick }) => {
  return (
    <header className="hero">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-logo">
            <img 
              src={fixieLogo} 
              alt="Fixie.ai - Intelligent IT Support Automation Platform" 
              className="hero-main-logo"
              style={{ width: '80px', height: '80px', marginBottom: '20px' }}
              loading="eager"
            />
          </div>
          <h1>We Fix IT.</h1>
          <p className="hero-subtitle">
            Fixie is your team's IT sidekick in chat — resetting passwords, fixing access issues, and solving everyday problems instantly. No forms, no tickets, and no waiting.
          </p>
          <p className="hero-subtitle">
            Your employees just need to ask, Fixie handles the Level-1 stuff, and IT can finally focus on the work that matters.
          </p>
          <div className="hero-cta">
            <button className="cta-button" onClick={onDemoClick}>Book a demo</button>
          </div>
          
          {/* Key Capabilities */}
          <div className="capabilities-grid">
            <div className="capability-card">
              <div className="capability-icon">🏢</div>
              <h3>AI-Powered Servicedesk Management</h3>
              <p>Intelligent automation for modern IT support workflows</p>
            </div>
            <div className="capability-card">
              <div className="capability-icon">⏱️</div>
              <h3>Minimal Downtime</h3>
              <p>Proactive monitoring and instant issue resolution</p>
            </div>
            <div className="capability-card">
              <div className="capability-icon">⚡</div>
              <h3>Seamless Integrations</h3>
              <p>Connect with all your existing IT tools and platforms</p>
            </div>
            <div className="capability-card">
              <div className="capability-icon">🔒</div>
              <h3>Enterprise Security</h3>
              <p>Robust security protocols and compliance standards</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default HeroSection;