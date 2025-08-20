// functions/src/jira-operations.ts
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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

// Jira operations function - handles all Jira-related actions
export const jiraOperations = onRequest(
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

          const { action, conversationId, ticketDetails, projectName } = req.body;
          
          if (!action) {
            res.status(400).json({ error: "Missing action parameter" });
            resolve();
            return;
          }

          // Get user's Jira connection status
          const jiraConnectionRef = db.collection("users").doc(userId).collection("platform-connections").doc("jira");
          const jiraConnectionSnap = await jiraConnectionRef.get();
          const hasJiraConnection = jiraConnectionSnap.exists && jiraConnectionSnap.data()?.status === 'connected';

          switch (action) {
            case 'check_connection':
              res.json({ 
                connected: hasJiraConnection,
                connectionData: hasJiraConnection ? jiraConnectionSnap.data() : null
              });
              resolve();
              break;

            case 'get_projects':
              if (!hasJiraConnection) {
                res.status(400).json({ error: "Jira not connected" });
                resolve();
                return;
              }
              // This would call your Jira API to get projects
              // For now, return mock data
              res.json({ 
                projects: [
                  { name: "IT Support", key: "IT", current: true },
                  { name: "Development", key: "DEV", current: false },
                  { name: "Operations", key: "OPS", current: false }
                ]
              });
              resolve();
              break;

            case 'create_ticket':
              if (!hasJiraConnection) {
                res.status(400).json({ error: "Jira not connected" });
                resolve();
                return;
              }
              if (!ticketDetails || !conversationId) {
                res.status(400).json({ error: "Missing ticket details or conversation ID" });
                resolve();
                return;
              }
              
              // Create ticket in Jira (this would call your Jira API)
              const ticketId = `TICKET-${Date.now()}`; // Mock ticket ID
              
              // Save ticket reference to conversation
              const conversationRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId);
              await conversationRef.update({
                jiraTicketId: ticketId,
                ticketCreatedAt: FieldValue.serverTimestamp(),
                ticketStatus: "open"
              });

              // Add ticket creation message to conversation
              const messagesRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId).collection("messages");
              await messagesRef.add({
                role: "assistant",
                content: `✅ Support ticket created successfully! Ticket ID: ${ticketId}`,
                createdAt: FieldValue.serverTimestamp(),
                ticketCreated: true,
                ticketId: ticketId
              });

              res.json({ 
                success: true, 
                ticketId: ticketId,
                message: "Ticket created successfully"
              });
              resolve();
              break;

            case 'update_ticket':
              if (!hasJiraConnection) {
                res.status(400).json({ error: "Jira not connected" });
                resolve();
                return;
              }
              // Handle ticket updates
              res.json({ success: true, message: "Ticket updated" });
              resolve();
              break;

            case 'select_project':
              if (!projectName) {
                res.status(400).json({ error: "Missing project name" });
                resolve();
                return;
              }
              
              // Update conversation with selected project
              const convRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId);
              await convRef.update({
                selectedJiraProject: projectName,
                projectSelectedAt: FieldValue.serverTimestamp()
              });

              // Add project selection message
              const msgRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId).collection("messages");
              await msgRef.add({
                role: "assistant",
                content: `📋 Project "${projectName}" selected for ticket creation.`,
                createdAt: FieldValue.serverTimestamp(),
                projectSelected: true,
                projectName: projectName
              });

              res.json({ 
                success: true, 
                projectSelected: projectName,
                message: "Project selected successfully"
              });
              resolve();
              break;

            default:
              res.status(400).json({ error: "Invalid action" });
              resolve();
              break;
          }

        } catch (error) {
          console.error("Error in Jira operations:", error);
          res.status(500).json({ 
            error: "Failed to perform Jira operation",
            details: error instanceof Error ? error.message : "Unknown error"
          });
          resolve();
        }
      });
    });
  }
);
