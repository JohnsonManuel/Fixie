import React, { useState, useEffect } from 'react';
import './styles/App.css';
import './styles/KeyCapabilities.css';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServiceNowAlternative from './pages/ServiceNowAlternative';
import EnterpriseITSM from './pages/EnterpriseITSM';
import ServiceNowMigration from './pages/ServiceNowMigration';
import Fortune500ITSM from './pages/Fortune500ITSM';
import DemoForm from './components/DemoForm';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import IntegrationsSection from './components/IntegrationsSection';
import { useAuth } from './hooks/useAuth';
import fixieLogo from './images/image.png';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  // Auto-redirect to dashboard if user is authenticated
  useEffect(() => {
    if (user && !loading) {
      setCurrentPage('dashboard');
    }
  }, [user, loading]);

  const handleSignupClick = () => {
    setCurrentPage('signup');
  };

  const handleLoginClick = () => {
    setCurrentPage('login');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
  };

  const handleSwitchToSignup = () => {
    setCurrentPage('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentPage('login');
  };



  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show dashboard if user is authenticated
  if (user && currentPage === 'dashboard') {
    return <Dashboard />;
  }

  // Show signup page
  if (currentPage === 'signup') {
    return <Signup onBackToHome={handleBackToHome} onSwitchToLogin={handleSwitchToLogin} />;
  }

  // Show login page
  if (currentPage === 'login') {
    return <Login onBackToHome={handleBackToHome} onSwitchToSignup={handleSwitchToSignup} />;
  }

  // Show ServiceNow Alternative page
  if (currentPage === 'servicenow-alternative') {
    return <ServiceNowAlternative onBackToHome={handleBackToHome} />;
  }

  // Show Enterprise ITSM page
  if (currentPage === 'enterprise-itsm') {
    return <EnterpriseITSM onBackToHome={handleBackToHome} />;
  }

  // Show ServiceNow Migration page
  if (currentPage === 'servicenow-migration') {
    return <ServiceNowMigration onBackToHome={handleBackToHome} />;
  }

  // Show Fortune 500 ITSM page
  if (currentPage === 'fortune500-itsm') {
    return <Fortune500ITSM onBackToHome={handleBackToHome} />;
  }

  // Show demo form
  if (currentPage === 'demo') {
    return <DemoForm onBackToHome={handleBackToHome} />;
  }

  // Show landing page
  return (
    <div className="App">
        {/* Navigation */}
        <nav className="navbar" role="navigation" aria-label="Main navigation">
          <div className="nav-container">
            <div className="nav-left">
              <div className="logo">
                <img 
                  src={fixieLogo} 
                  alt="Fixie.ai - AI-Powered IT Support Platform Logo" 
                  className="nav-logo"
                  style={{ width: '32px', height: '32px' }}
                  loading="eager"
                />
                <span className="logo-text">fixie.ai</span>
              </div>
            </div>
            <div className="nav-center">
            </div>
            <div className="nav-right">
              <button className="nav-btn-secondary" onClick={handleLoginClick} aria-label="Log in to your account">Log in</button>
              <button className="nav-btn-primary" onClick={handleSignupClick} aria-label="Sign up for free demo">Sign up</button>
            </div>
          </div>
        </nav>

      <HeroSection onDemoClick={() => setCurrentPage('demo')} />

      {/* Problem Statement */}
      <section className="problem-statement" aria-labelledby="problem-heading">
        <div className="container">
          <div className="problem-content">
            <h2 id="problem-heading">Simplify IT Support with Chat-first Resolution</h2>
            <p className="problem-text">
              Fixie provides employees with a simple chat interface to resolve common IT issues – such as password resets and access requests – without requiring helpdesk intervention. By masking IT complexity behind a conversational experience, Fixie resolves the majority of Level-1 tickets automatically while integrating seamlessly with existing IT systems, reducing support costs and improving employee productivity.
            </p>
          </div>
        </div>
      </section>

      {/* Product Flow Visual */}
      <section className="product-flow-visual">
        <div className="container">
          <div className="hero-visual">
            <div className="hero-image-placeholder">
              {/* Product flow background image is set via CSS */}
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section className="key-capabilities">
        <div className="container">
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
      </section>

      {/* Problem Statement */}
      <section className="problem-statement" aria-labelledby="problem-heading">
        <div className="container">
          <div className="problem-content">
            <h2 id="problem-heading">Simplify IT Support with Chat-first Resolution</h2>
            <p className="problem-text">
              Fixie provides employees with a simple chat interface to resolve common IT issues – such as password resets and access requests – without requiring helpdesk intervention. By masking IT complexity behind a conversational experience, Fixie resolves the majority of Level-1 tickets automatically while integrating seamlessly with existing IT systems, reducing support costs and improving employee productivity.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
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



      {/* Key Features */}
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

      {/* Benefits */}
      <section className="benefits">
        <div className="container">
          <h2>Benefits for Your Organization</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-number">80%</div>
              <h3>Cut Resolution Times</h3>
              <p>Reduce IT issue resolution time and improve user satisfaction.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">24/7</div>
              <h3>Always Available</h3>
              <p>AI never sleeps, providing support around the clock.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">$0</div>
              <h3>Lower Support Costs</h3>
              <p>Automate high-volume tickets and reduce manual work.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="integrations">
        <div className="container">
          <h2>Integrates with all Your Existing IT Tools</h2>
          <p className="integrations-subtitle">Connect seamlessly with the platforms your team already uses</p>
          <div className="logos-container">
            <div className="logos-scroll">
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg" alt="Slack" />
              </div>
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg" alt="Jira" />
              </div>
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" alt="AWS" />
              </div>
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" alt="Azure" />
              </div>
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg" alt="Windows" />
              </div>
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" alt="macOS" />
              </div>
              <div className="logo-item">
                <span className="text-logo">Zoom</span>
              </div>
              <div className="logo-item">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/200px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png" alt="Teams" />
              </div>
              <div className="logo-item">
                <span className="text-logo">GNOME</span>
              </div>
              <div className="logo-item">
                <span className="text-logo">Freshdesk</span>
              </div>
              <div className="logo-item">
                <span className="text-logo">ManageEngine</span>
              </div>
              {/* Duplicate for seamless loop */}
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg" alt="Slack" />
              </div>
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg" alt="Jira" />
              </div>
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" alt="AWS" />
              </div>
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" alt="Azure" />
              </div>
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg" alt="Windows" />
              </div>
              <div className="logo-item">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" alt="macOS" />
              </div>
              <div className="logo-item">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Zoom_logo.svg/200px-Zoom_logo.svg.png" alt="Zoom" />
              </div>
              <div className="logo-item">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/200px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png" alt="Teams" />
              </div>
              <div className="logo-item">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Gnome-logo.svg/200px-Gnome-logo.svg.png" alt="GNOME" />
              </div>
              <div className="logo-item">
                <span className="text-logo">Freshdesk</span>
              </div>
              <div className="logo-item">
                <span className="text-logo">ManageEngine</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="use-cases">
        <div className="container">
          <h2>Example Use Cases</h2>
          <div className="use-cases-grid">
            <div className="use-case-item">
              <div className="use-case-icon">🔐</div>
              <h3>Password resets & account unlocks</h3>
            </div>
            <div className="use-case-item">
              <div className="use-case-icon">📧</div>
              <h3>Email configuration issues</h3>
            </div>
            <div className="use-case-item">
              <div className="use-case-icon">🌐</div>
              <h3>VPN & network connectivity fixes</h3>
            </div>
            <div className="use-case-item">
              <div className="use-case-icon">🖨️</div>
              <h3>Printer setup & troubleshooting</h3>
            </div>
            <div className="use-case-item">
              <div className="use-case-icon">💾</div>
              <h3>Software installation & updates</h3>
            </div>
            <div className="use-case-item">
              <div className="use-case-icon">✅</div>
              <h3>Endpoint compliance checks</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose">
        <div className="container">
          <div className="why-choose-content">
            <h2>Why Choose Us</h2>
            <p className="why-choose-text">
              Because unlike static chatbots or ticket trackers, we're the IT agent that works 24/7, 
              never forgets a fix, and integrates directly with your existing workflow — no rip-and-replace required.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>"Your IT helpdesk just got superpowers."</h2>
          <button className="cta-primary large" onClick={() => setCurrentPage('demo')}>
            <span className="cta-icon">⚡</span>
            Book a demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#integrations">Integrations</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#careers">Careers</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <a href="#docs">Documentation</a>
              <a href="#blog">Blog</a>
              <a href="#support">Support</a>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#security">Security</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Fixie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 