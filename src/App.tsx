import React, { useState, useEffect } from 'react';
import './App.css';
import Signup from './Signup';
import Login from './Login';
import Dashboard from './Dashboard';
import { useAuth } from './hooks/useAuth';

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

  // Show landing page
  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div className="logo">
              <span className="logo-text">Fixie</span>
            </div>
          </div>
          <div className="nav-center">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#integrations">Integrations</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-right">
            <button className="nav-btn-secondary" onClick={handleLoginClick}>Log in</button>
            <button className="nav-btn-primary" onClick={handleSignupClick}>Sign up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1>Your IT Issues, Resolved Before They Slow You Down</h1>
            <p className="hero-subtitle">
              An AI-powered ticket resolution system that understands, diagnoses, and fixes common IT problems — instantly. 
              Integrated with your existing ticketing platforms, powered by real-time agent tools, and designed to keep your team productive.
            </p>
            <div className="hero-cta">
              <button className="cta-primary">
                <span className="cta-icon">⚡</span>
                Get a Demo
              </button>
            </div>
            <div className="hero-trust">
              <p>Trusted by teams at:</p>
              <div className="trust-logos">
                <span>Google</span>
                <span>Microsoft</span>
                <span>Netflix</span>
                <span>Spotify</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-placeholder">
              <div className="floating-card card-1">
                <div className="card-icon">🔧</div>
                <div className="card-text">Ticket Resolved</div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">🤖</div>
                <div className="card-text">AI Processing</div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon">⚡</div>
                <div className="card-text">Instant Fix</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="problem-statement">
        <div className="container">
          <div className="problem-content">
            <h2>Why We Exist</h2>
            <p className="problem-text">
              Every minute your team spends wrestling with technical issues is a minute of lost productivity.
            </p>
            <p className="problem-highlight">
              Traditional ITSM tools track tickets — we resolve them. Our AI engine doesn't just suggest fixes, 
              it executes them through deep integrations with your IT ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="flow-container">
            <div className="flow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Detect & Understand</h3>
                <p>Automatically detects new tickets or user issues from your existing platforms (ServiceNow, Jira Service Management, Freshdesk, and more).</p>
              </div>
            </div>
            <div className="flow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Diagnose</h3>
                <p>Uses AI trained on thousands of IT scenarios to identify the root cause in seconds.</p>
              </div>
            </div>
            <div className="flow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Resolve</h3>
                <p>Executes automated actions via integrated agent tools — from restarting services to resetting passwords, applying patches, and more.</p>
              </div>
            </div>
            <div className="flow-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Learn & Improve</h3>
                <p>Gets smarter with every resolution, reducing future ticket volume.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="features">
        <div className="container">
          <h2>Key Features</h2>
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
          <button className="cta-primary large">
            <span className="cta-icon">⚡</span>
            Schedule a Live Demo
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