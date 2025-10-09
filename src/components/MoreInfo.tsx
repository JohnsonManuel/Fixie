
import React from 'react';
import fixieLogo from '../images/image.png';

const MoreInfo: React.FC = () => (
    <>
      {/* <section className="integrations">
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
                <img src="https://cdn.worldvectorlogo.com/logos/zoom-communications-logo.svg" alt="Zoom" onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg';
                  e.currentTarget.onerror = () => {
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) nextElement.style.display = 'block';
                  };
                }} />
                <span className="text-logo" style={{display: 'none'}}>Zoom</span>
              </div>
              <div className="logo-item">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/200px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png" alt="Teams" />
              </div>
              <div className="logo-item">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/68/Gnomelogo.svg" alt="GNOME" onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://logos-download.com/wp-content/uploads/2016/09/GNOME_logo.png';
                  e.currentTarget.onerror = () => {
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) nextElement.style.display = 'block';
                  };
                }} />
                <span className="text-logo" style={{display: 'none'}}>GNOME</span>
              </div>
              <div className="logo-item">
                <span className="text-logo">Freshdesk</span>
              </div>
              <div className="logo-item">
                <span className="text-logo">ManageEngine</span>
              </div>

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
      </section> */}

      {/* Use Cases */}
      {/* <section className="use-cases">
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
      </section> */}
    </>
)

export default MoreInfo;