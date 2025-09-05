import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServiceNowAlternative from './pages/ServiceNowAlternative';
import EnterpriseITSM from './pages/EnterpriseITSM';
import ServiceNowMigration from './pages/ServiceNowMigration';
import Fortune500ITSM from './pages/Fortune500ITSM';
import DemoForm from './components/DemoForm';
import { useAuth } from './hooks/useAuth';
import fixieLogo from './images/favicon.png';

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

      {/* Hero Section */}
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
            <h1>We Fix(ie) IT.</h1>
            <p className="hero-subtitle">
              Fixie is an AI-powered ticket resolution system that understands, diagnoses, and fixes common IT problems — instantly. Integrates with your existing ticketing platforms, powered by real-time agentic AI tools, and designed to keep your team productive.
            </p>
            <div className="hero-cta">
              <button className="cta-button" onClick={() => setCurrentPage('demo')}>Book a demo</button>
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

      {/* Problem Statement */}
      <section className="problem-statement" aria-labelledby="problem-heading">
        <div className="container">
          <div className="problem-content">
            <h2 id="problem-heading">Why SMBs Choose Fixie Over Heavy ITSM Tools</h2>
            <p className="problem-text">
              Big ITSM platforms like ServiceNow are powerful — but often too complex and expensive for firms under 1,000 employees. Smaller teams need something lightweight, fast to set up, and smart enough to handle day-to-day IT problems without layers of forms and approvals.
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
            <h2 id="how-it-works-heading">Enterprise ITSM That Outperforms ServiceNow</h2>
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
            <h2 id="features-heading">Enterprise Features That Beat ServiceNow</h2>
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
              <div className="feature-icon">📚</div>
              <h3>Pre-Built Fix Libraries</h3>
              <p>Hundreds of ready-to-use workflows for common IT issues.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>Custom Automation Builder</h3>
              <p>Create your own AI-driven fixes without coding.</p>
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
              <p>Dramatically reduce the time it takes to resolve IT issues</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">24/7</div>
              <h3>Always Available</h3>
              <p>AI never sleeps, providing support around the clock</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">$0</div>
              <h3>Lower Support Costs</h3>
              <p>Automate high-volume tickets and reduce manual work</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">100%</div>
              <h3>User Satisfaction</h3>
              <p>Instant fixes lead to happier, more productive teams</p>
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