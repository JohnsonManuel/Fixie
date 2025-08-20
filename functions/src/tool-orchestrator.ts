// functions/src/tool-orchestrator.ts
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import cors from 'cors';

const db = getFirestore();
const auth = getAuth();

// Initialize CORS middleware
const corsHandler = cors({ 
  origin: true, // Allow all origins in development
  credentials: true 
});

// Configuration
const REGION = "europe-west3";

// Tool orchestrator - coordinates tool actions and workflow
export const toolOrchestrator = onRequest(
  { 
    region: REGION,
    timeoutSeconds: 60,
    memory: "256MiB",
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

          const { action, conversationId, toolType, toolData } = req.body;
          
          if (!action || !conversationId) {
            res.status(400).json({ error: "Missing action or conversation ID" });
            resolve();
            return;
          }

          // Get conversation context
          const conversationRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId);
          const conversationDoc = await conversationRef.get();
          
          if (!conversationDoc.exists) {
            res.status(404).json({ error: "Conversation not found" });
            resolve();
            return;
          }

          const conversationData = conversationDoc.data();
          const supportState = conversationData?.supportState;

          switch (action) {
            case 'escalate_to_ticket':
              if (toolType !== 'ticket_creation') {
                res.status(400).json({ error: "Invalid tool type for escalation" });
                resolve();
                return;
              }

              // Check if user has Jira connection
              const jiraConnectionRef = db.collection("users").doc(userId).collection("platform-connections").doc("jira");
              const jiraConnectionSnap = await jiraConnectionRef.get();
              const hasJiraConnection = jiraConnectionSnap.exists && jiraConnectionSnap.data()?.status === 'connected';

              if (!hasJiraConnection) {
                // Return action to connect Jira
                res.json({
                  action: 'connect_jira',
                  message: 'Jira connection required for ticket creation',
                  data: { reason: 'Ticket creation requires Jira connection' }
                });
                resolve();
                return;
              }

              // Check if project is selected
              const selectedProject = conversationData?.selectedJiraProject;
              if (!selectedProject) {
                // Return action to select project
                res.json({
                  action: 'select_project',
                  message: 'Please select a Jira project for ticket creation',
                  data: { 
                    projects: [
                      { name: "IT Support", key: "IT", current: true },
                      { name: "Development", key: "DEV", current: false },
                      { name: "Operations", key: "OPS", current: false }
                    ]
                  }
                });
                resolve();
                return;
              }

              // Ready to create ticket
              res.json({
                action: 'create_ticket',
                message: 'Ready to create ticket',
                data: { 
                  ticketDetails: supportState?.ticketDetails,
                  project: selectedProject
                }
              });
              resolve();
              break;

            case 'execute_tool':
              if (!toolType) {
                res.status(400).json({ error: "Missing tool type" });
                resolve();
                return;
              }

              // Route to appropriate tool function
              switch (toolType) {
                case 'jira_ticket':
                  // This would call the Jira operations function
                  res.json({
                    action: 'call_jira_function',
                    toolType: 'jira_ticket',
                    data: toolData
                  });
                  resolve();
                  break;

                case 'slack_notification':
                  // This would call a Slack function
                  res.json({
                    action: 'call_slack_function',
                    toolType: 'slack_notification',
                    data: toolData
                  });
                  resolve();
                  break;

                default:
                  res.status(400).json({ error: "Unsupported tool type" });
                  resolve();
                  break;
              }
              break;

            case 'get_available_tools':
              // Return list of available tools based on user's connections
              const availableTools = [];
              
              // Check Jira connection
              const jiraConn = await db.collection("users").doc(userId).collection("platform-connections").doc("jira").get();
              if (jiraConn.exists && jiraConn.data()?.status === 'connected') {
                availableTools.push({
                  type: 'jira_ticket',
                  name: 'Jira Ticket Creation',
                  description: 'Create support tickets in Jira',
                  available: true
                });
              }

              // Check Slack connection (if implemented)
              const slackConn = await db.collection("users").doc(userId).collection("platform-connections").doc("slack").get();
              if (slackConn.exists && slackConn.data()?.status === 'connected') {
                availableTools.push({
                  type: 'slack_notification',
                  name: 'Slack Notifications',
                  description: 'Send notifications to Slack channels',
                  available: true
                });
              }

              res.json({ availableTools });
              resolve();
              break;

            default:
              res.status(400).json({ error: "Invalid action" });
              resolve();
              break;
          }

        } catch (error) {
          console.error("Error in tool orchestrator:", error);
          res.status(500).json({ 
            error: "Failed to orchestrate tool action",
            details: error instanceof Error ? error.message : "Unknown error"
          });
          resolve();
        }
      });
    });
  }
);
