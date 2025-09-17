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
        </div>
        <div className="hero-visual">
          <div className="hero-image-placeholder">
            <div className="floating-card card-1">
              <div className="card-icon">🏢</div>
              <div className="card-text">AI-Powered Servicedesk Management</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">⏱️</div>
              <div className="card-text">Low downtime</div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">⚡</div>
              <div className="card-text">Integrations with leading IT tools</div>
            </div>
            <div className="floating-card card-4">
              <div className="card-icon">🔒</div>
              <div className="card-text">Robust security protocols</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;