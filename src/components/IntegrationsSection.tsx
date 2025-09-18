import React from 'react';

const IntegrationsSection: React.FC = () => {
  return (
    <section className="integrations">
      <div className="container">
        <h2>Integrates with Your Existing Tools</h2>
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
  );
};

export default IntegrationsSection;