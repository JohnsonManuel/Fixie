// functions/src/test-jira.ts
// Test function to verify Jira OAuth setup

import { onRequest } from "firebase-functions/v2/https";
import cors from 'cors';

// Initialize CORS middleware
const corsHandler = cors({ 
  origin: true, // Allow all origins in development
  credentials: true 
});

export const testJiraSetup = onRequest(
  {
    region: "europe-west10",
  },
  async (req: any, res: any) => {
    // Handle CORS preflight
    return new Promise((resolve, reject) => {
      corsHandler(req, res, async () => {
        try {
          res.json({
            message: "Jira OAuth setup is working!",
            timestamp: new Date().toISOString(),
            region: "europe-west10",
            functions: [
              "jiraOAuthStart",
              "jiraOAuthCallback", 
              "jiraConnectionStatus"
            ],
            nextSteps: [
              "1. Set Firebase secrets: JIRA_CLIENT_ID and JIRA_CLIENT_SECRET",
              "2. Create Jira OAuth app at Atlassian Developer Console",
              "3. Set callback URL to: https://europe-west10-jj-ai-platform.cloudfunctions.net/jiraOAuthCallback",
              "4. Deploy functions: npm run deploy",
              "5. Test OAuth flow in your app"
            ]
          });
          resolve();
        } catch (error) {
          res.status(500).json({ 
            error: "Test failed", 
            details: error instanceof Error ? error.message : "Unknown error" 
          });
          resolve();
        }
      });
    });
  }
);
