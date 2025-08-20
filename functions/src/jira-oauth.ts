// functions/src/jira-oauth.ts
// Dedicated Jira OAuth functions

import { onRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { JiraService } from "./jira/service";
import { JIRA_OAUTH_CONFIG, JIRA_CLIENT_ID, JIRA_CLIENT_SECRET } from "./jira/config";
import cors from 'cors';

const auth = getAuth();

// Initialize CORS middleware
const corsHandler = cors({ 
  origin: true, // Allow all origins in development
  credentials: true 
});

// Jira OAuth Start Function
export const jiraOAuthStart = onRequest(
  {
    region: "europe-west10", // Match your Firestore region
    secrets: [JIRA_CLIENT_ID, JIRA_CLIENT_SECRET],
  },
  async (req: any, res: any) => {
    // Handle CORS preflight
    return new Promise((resolve, reject) => {
      corsHandler(req, res, async () => {
        try {
          // Verify authentication
          const idToken = req.query.idToken;
          if (!idToken) {
            res.status(401).json({ error: "No ID token provided" });
            resolve();
            return;
          }

          const decodedToken = await auth.verifyIdToken(idToken);
          const userId = decodedToken.uid;
          const conversationId = req.query.conversationId || '';

          // Generate OAuth state and PKCE challenge
          const oauthState = JiraService.generateOAuthState(conversationId);
          
          // Store OAuth state in Firestore for verification
          await JiraService.storeOAuthState(userId, oauthState);

          // Build OAuth URL
          const oauthUrl = new URL(JIRA_OAUTH_CONFIG.authorizeUrl);
          oauthUrl.searchParams.set('audience', 'api.atlassian.com');
          oauthUrl.searchParams.set('client_id', JIRA_CLIENT_ID.value());
          oauthUrl.searchParams.set('scope', JIRA_OAUTH_CONFIG.scope);
          oauthUrl.searchParams.set('redirect_uri', JIRA_OAUTH_CONFIG.redirectUri);
          oauthUrl.searchParams.set('state', oauthState.state);
          oauthUrl.searchParams.set('response_type', 'code');
          oauthUrl.searchParams.set('prompt', 'consent');
          oauthUrl.searchParams.set('code_challenge', oauthState.codeChallenge);
          oauthUrl.searchParams.set('code_challenge_method', 'S256');

          // Redirect to Atlassian OAuth
          res.redirect(oauthUrl.toString());
          resolve();
        } catch (error) {
          console.error('Error in jiraOAuthStart:', error);
          res.status(500).json({ error: "OAuth initiation failed" });
          resolve();
        }
      });
    });
  }
);

// Jira OAuth Callback Function
export const jiraOAuthCallback = onRequest(
  {
    region: "europe-west10", // Match your Firestore region
    secrets: [JIRA_CLIENT_ID, JIRA_CLIENT_SECRET],
  },
  async (req: any, res: any) => {
    // Handle CORS preflight
    return new Promise((resolve, reject) => {
      corsHandler(req, res, async () => {
        try {
          // Skip authentication for OAuth callbacks - they come from Atlassian
          // The security is maintained through OAuth state validation
          const { code, state, error } = req.query;
          
          if (error) {
            console.error('OAuth error:', error);
            res.status(400).send(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f8f9fa;">
                  <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #dc3545; margin-bottom: 20px;">❌ OAuth Error</h2>
                    <p style="color: #6c757d; margin-bottom: 20px;">Error: ${error}</p>
                    <p style="color: #6c757d; margin-bottom: 30px;">Please try again or contact support.</p>
                    <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                      Close Window
                    </button>
                  </div>
                </body>
              </html>
            `);
            resolve();
            return;
          }

          if (!code || !state) {
            res.status(400).send(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f8f9fa;">
                  <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #dc3545; margin-bottom: 20px;">❌ Invalid OAuth Response</h2>
                    <p style="color: #6c757d; margin-bottom: 30px;">Missing authorization code or state.</p>
                    <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                      Close Window
                    </button>
                  </div>
                </body>
              </html>
            `);
            resolve();
            return;
          }

          // Get OAuth state from Firestore
          const oauthStateData = await JiraService.getOAuthState(state as string);
          
          if (!oauthStateData) {
            res.status(400).send(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f8f9fa;">
                  <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #dc3545; margin-bottom: 20px;">❌ Invalid OAuth State</h2>
                    <p style="color: #6c757d; margin-bottom: 30px;">OAuth state not found or expired.</p>
                    <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                      Close Window
                    </button>
                  </div>
                </body>
              </html>
            `);
            resolve();
            return;
          }

          const { userId, oauthState } = oauthStateData;
          
          // Check if state is expired
          if (oauthState.expiresAt && new Date(oauthState.expiresAt) < new Date()) {
            res.status(400).send(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f8f9fa;">
                  <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #dc3545; margin-bottom: 20px;">❌ OAuth Expired</h2>
                    <p style="color: #6c757d; margin-bottom: 30px;">OAuth state has expired. Please try again.</p>
                    <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                      Close Window
                    </button>
                  </div>
                </body>
              </html>
            `);
            resolve();
            return;
          }

          // Exchange code for tokens
          const tokenData = await JiraService.exchangeCodeForTokens(code as string, oauthState.codeVerifier);
          
          // Get accessible resources (cloud IDs)
          const availableProjects = await JiraService.getAccessibleResources(tokenData.access_token);

          if (availableProjects.length === 0) {
            res.status(400).send(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f8f9fa;">
                  <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #dc3545; margin-bottom: 20px;">❌ No Jira Access</h2>
                    <p style="color: #6c757d; margin-bottom: 30px;">No accessible Jira resources found.</p>
                    <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                      Close Window
                    </button>
                  </div>
                </body>
              </html>
            `);
            resolve();
            return;
          }

          // Save Jira connection to Firestore
          await JiraService.saveJiraConnection(
            userId,
            tokenData.access_token,
            tokenData.refresh_token,
            tokenData.expires_in,
            tokenData.scope,
            availableProjects
          );

          // Clean up OAuth state
          await JiraService.cleanupOAuthState(userId);

          // Send success response
          res.send(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f8f9fa; margin: 0;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <h2 style="color: #0052CC; margin-bottom: 20px;">✅ Jira Connected Successfully!</h2>
                  <p style="color: #6c757d; margin-bottom: 20px;">Your Jira account is now connected and ready to use.</p>
                  
                  ${availableProjects.length > 1 ? 
                    `<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
                      <p style="margin: 0 0 10px 0; font-weight: 600; color: #495057;"><strong>Available Projects:</strong></p>
                      <p style="margin: 0 0 10px 0; color: #6c757d;">${availableProjects.map(p => p.name).join(', ')}</p>
                      <p style="margin: 0; color: #6c757d;"><strong>Default Project:</strong> ${availableProjects[0].name}</p>
                    </div>` : 
                    `<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #6c757d;"><strong>Project:</strong> ${availableProjects[0].name}</p>
                    </div>`
                  }
                  
                  <p style="color: #6c757d; margin-bottom: 30px;">You can close this window and return to your chat.</p>
                  
                  <div style="margin: 20px 0;">
                    <button onclick="window.close()" style="background: #0052CC; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">
                      Close Window
                    </button>
                  </div>
                  
                  <p style="font-size: 14px; color: #adb5bd; margin-top: 30px;">
                    Connection established at ${new Date().toLocaleString()}
                  </p>
                </div>
                
                <script>
                  // Auto-close after 5 seconds
                  setTimeout(() => window.close(), 5000);
                  
                  // Notify parent window if possible
                  if (window.opener) {
                    window.opener.postMessage({ type: 'jira_connected', success: true }, '*');
                  }
                </script>
              </body>
            </html>
          `);

        } catch (error) {
          console.error('Error in jiraOAuthCallback:', error);
          res.status(500).send(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f8f9fa;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <h2 style="color: #dc3545; margin-bottom: 20px;">❌ OAuth Callback Error</h2>
                  <p style="color: #6c757d; margin-bottom: 30px;">An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}</p>
                  <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    Close Window
                  </button>
                </div>
              </body>
            </html>
          `);
        }
      });
    });
  }
);

// Jira Connection Status Function
export const jiraConnectionStatus = onRequest(
  {
    region: "europe-west10", // Match your Firestore region
    secrets: [JIRA_CLIENT_ID, JIRA_CLIENT_SECRET],
  },
  async (req: any, res: any) => {
    // Handle CORS preflight
    return new Promise((resolve, reject) => {
      corsHandler(req, res, async () => {
        try {
          // Verify authentication
          const idToken = req.body.idToken;
          if (!idToken) {
            res.status(401).json({ error: "No ID token provided" });
            resolve();
            return;
          }

          const decodedToken = await auth.verifyIdToken(idToken);
          const userId = decodedToken.uid;

          // Get Jira connection status
          const connection = await JiraService.getJiraConnection(userId);
          
          if (!connection) {
            res.json({ connected: false, status: 'not_connected' });
            resolve();
            return;
          }

          const isExpired = connection.expiresAt && new Date(connection.expiresAt) < new Date();
          
          if (isExpired && connection.refreshToken) {
            // Try to refresh the token
            try {
              const refreshData = await JiraService.refreshAccessToken(connection.refreshToken);
              
              // Update tokens in Firestore
              await JiraService.saveJiraConnection(
                userId,
                refreshData.access_token,
                refreshData.refresh_token || connection.refreshToken,
                refreshData.expires_in,
                connection.scope || '',
                connection.availableProjects || []
              );

              res.json({ 
                connected: true, 
                status: 'connected',
                availableProjects: connection.availableProjects,
                defaultProject: connection.defaultProject,
                expiresAt: new Date(Date.now() + (refreshData.expires_in * 1000))
              });
              resolve();
              return;
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }

          res.json({ 
            connected: !isExpired && connection.status === 'connected',
            status: isExpired ? 'expired' : connection.status,
            availableProjects: connection.availableProjects,
            defaultProject: connection.defaultProject,
            expiresAt: connection.expiresAt
          });
          resolve();

        } catch (error) {
          console.error('Error in jiraConnectionStatus:', error);
          res.status(500).json({ error: "Failed to check connection status" });
          resolve();
        }
      });
    });
  }
);
