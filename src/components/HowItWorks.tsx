
import React from 'react';
import fixieLogo from '../images/image.png';

const HowItWorks: React.FC = () => (
    <section className="how-it-works" id="how-it-works" aria-labelledby="how-it-works-heading">
        <div className="container">
          <div className="section-header">
            <img 
              src={fixieLogo} 
              alt="Fixie.ai AI-powered automation process" 
              className="section-logo"
              style={{ width: '48px', height: '48px', marginBottom: '16px' }}
              loading="lazy"
            />
            <h2 id="how-it-works-heading">Chat-First IT Support For Companies of All Sizes</h2>
          </div>
          <div className="flow-container">
            <div className="flow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Simple Integration</h3>
                <p>Connect quickly with the tools SMBs already use — Freshservice, Jira, Zoho Desk, Intune, and more. No months-long migrations or costly consultants. In addition we provide our own in-house Helpdesk platform to create and manage tickets.</p>
              </div>
            </div>
            <div className="flow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI-Powered Troubleshooting</h3>
                <p>Fixie guides employees in plain English, attempts safe fixes automatically, and escalates only when needed. It reduces back-and-forth and saves hours of IT time.</p>
              </div>
            </div>
            <div className="flow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Automated Resolution</h3>
                <p>From clearing caches to resetting services, Fixie handles routine fixes instantly. Every action is logged with an audit trail for security and transparency.</p>
              </div>
            </div>
            <div className="flow-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Built for Lean IT Teams</h3>
                <p>Fixie learns from recurring issues and suggests faster paths to resolution, helping small IT teams support growing organizations without adding headcount.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )

export default HowItWorks;