import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ServiceNowAlternative from './pages/ServiceNowAlternative';
import EnterpriseITSM from './pages/EnterpriseITSM';
import ServiceNowMigration from './pages/ServiceNowMigration';
import Fortune500ITSM from './pages/Fortune500ITSM';
import DemoForm from './components/DemoForm';
import LandingPage from './pages/LandingPage';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'home' | 'signup' | 'login' | 'dashboard' | 'servicenow-alternative' | 'enterprise-itsm' | 'servicenow-migration' | 'fortune500-itsm' | 'demo'>('home');

  useEffect(() => {
    if (user && !loading) {
      setCurrentPage('dashboard');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />;
    case 'signup':
      return <Signup onBackToHome={() => setCurrentPage('home')} onSwitchToLogin={() => setCurrentPage('login')} />;
    case 'login':
      return <Login onBackToHome={() => setCurrentPage('home')} onSwitchToSignup={() => setCurrentPage('signup')} />;
    case 'servicenow-alternative':
      return <ServiceNowAlternative onBackToHome={() => setCurrentPage('home')} />;
    case 'enterprise-itsm':
      return <EnterpriseITSM onBackToHome={() => setCurrentPage('home')} />;
    case 'servicenow-migration':
      return <ServiceNowMigration onBackToHome={() => setCurrentPage('home')} />;
    case 'fortune500-itsm':
      return <Fortune500ITSM onBackToHome={() => setCurrentPage('home')} />;
    case 'demo':
      return <DemoForm onBackToHome={() => setCurrentPage('home')} />;
    default:
      return <LandingPage onNavigate={setCurrentPage} />;
  }
}

export default App;
