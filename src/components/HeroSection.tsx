import React from 'react';
import fixieLogo from '../images/image.png';
import { useDynamicContent } from '../hooks/useDynamicContent';

interface HeroSectionProps {
  onDemoClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onDemoClick }) => {
  const { content, loading } = useDynamicContent();

  if (loading || !content) {
    return (
      <header className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="loading-spinner"></div>
            <p>Loading latest content...</p>
          </div>
        </div>
      </header>
    );
  }
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
          <h1>{content.hero.title}</h1>
          {content.hero.subtitle.map((subtitle, index) => (
            <p key={index} className="hero-subtitle">{subtitle}</p>
          ))}
          <div className="hero-cta">
            <button className="cta-button" onClick={onDemoClick}>{content.hero.ctaText}</button>
          </div>
          
          {/* Key Capabilities */}
          <div className="capabilities-grid">
            {content.capabilities.map((capability, index) => (
              <div key={index} className="capability-card">
                <div className="capability-icon">{capability.icon}</div>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </header>
  );
};

export default HeroSection;