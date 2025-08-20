// functions/src/chat.ts
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
import { SimpleSupportSystem, SupportState } from "./simple-support";
import { getTitlePrompt } from "./prompts";
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
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// Pure chat function - handles conversation processing only
export const chat = onRequest(
  { 
    region: REGION,
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 120,
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

          // Get conversation ID and message
          const { conversationId, message } = req.body;
          if (!conversationId || !message) {
            res.status(400).json({ error: "Missing conversationId or message" });
            resolve();
            return;
          }

          // Get conversation history
          const messagesRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId).collection("messages");
          const snap = await messagesRef.get();

          // Build conversation context
          const chatMsgs: any[] = [];
          snap.docs.forEach((doc: any) => {
            const msgData = doc.data();
            chatMsgs.push({
              role: msgData.role,
              content: msgData.content,
            });
          });

          // Get or create support state
          const conversationRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId);
          const conversationDoc = await conversationRef.get();
          
          let supportState: SupportState;
          
          if (conversationDoc.exists && conversationDoc.data()?.supportState) {
            // Use existing support state
            supportState = conversationDoc.data()?.supportState;
          } else {
            // Create new support state for this conversation
            supportState = {
              userId,
              conversationId,
              issue: message,
              attempts: 0,
              solutions: [],
              userFeedback: [],
              currentStage: "analyzing",
              lastMessage: message,
              jiraConnected: false // Will be updated by tool functions
            };
          }

          // Update support state with new message
          supportState.lastMessage = message;
          supportState.userFeedback = [...supportState.userFeedback, message];

          // Process the message using the simplified support system
          const supportSystem = new SimpleSupportSystem(OPENAI_API_KEY.value());
          const result = await supportSystem.processMessage(supportState);

          // Update support state in Firestore
          const updateData: any = {
            updatedAt: FieldValue.serverTimestamp(),
            lastMessage: message
          };

          // Only add supportState if it exists and has content
          if (result && Object.keys(result).length > 0) {
            // Filter out undefined values from the result
            const filteredResult = Object.fromEntries(
              Object.entries(result).filter(([_, value]) => value !== undefined)
            );
            updateData.supportState = filteredResult;
          }

          await conversationRef.update(updateData);

          // Save assistant response
          const messageData: any = {
            role: "assistant",
            content: result.response,
            createdAt: FieldValue.serverTimestamp(),
            supportStage: result.currentStage
          };

          // Only add ticketDetails if it exists and has content
          if (result.ticketDetails && Object.keys(result.ticketDetails).length > 0) {
            messageData.ticketDetails = result.ticketDetails;
          }

          await messagesRef.add(messageData);

          // Update conversation title if needed
          await updateConversationTitle(userId, conversationId, chatMsgs);

          // Return response with potential tool actions
          res.json({
            response: result.response,
            supportStage: result.currentStage,
            requiresTool: result.currentStage === "escalating",
            toolType: result.currentStage === "escalating" ? "ticket_creation" : null,
            ticketDetails: result.ticketDetails
          });
          resolve();

        } catch (error) {
          console.error("Error in chat function:", error);
          
          // Handle specific authentication errors
          if (error instanceof Error) {
            if (error.message.includes('Firebase ID token has expired') || 
                error.message.includes('auth/id-token-expired')) {
              res.status(401).json({ 
                error: "🔐 Authentication token expired. Please refresh the page and try again.",
                details: "Your session has expired. Please refresh the page to get a new token.",
                code: "TOKEN_EXPIRED"
              });
              resolve();
              return;
            }
            
            if (error.message.includes('auth/id-token-revoked') || 
                error.message.includes('auth/user-not-found')) {
              res.status(401).json({ 
                error: "🔐 Authentication failed. Please log in again.",
                details: "Your account may have been logged out. Please log in again.",
                code: "AUTH_FAILED"
              });
              resolve();
              return;
            }
          }
          
          res.status(500).json({ 
            error: "🤖 Sorry, I encountered an error. Please try again.",
            details: error instanceof Error ? error.message : "Unknown error"
          });
          resolve();
        }
      });
    });
  }
);

// Update conversation title function
async function updateConversationTitle(userId: string, conversationId: string, chatMsgs: any[]) {
  try {
    const conversationRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId);
    const conversationDoc = await conversationRef.get();
    
    if (!conversationDoc.exists) return;

    const conversationData = conversationDoc.data();
    const shouldUpdateTitle = !conversationData?.title || 
                             conversationData.title === "New Chat" ||
                             chatMsgs.length % 10 === 0; // Update every 10 messages

    if (shouldUpdateTitle) {
      const titlePrompt = getTitlePrompt(chatMsgs.map(msg => `${msg.role}: ${msg.content}`).join('\n'));
      
      // Use OpenAI directly for title generation to avoid LangChain complexity
      const titleResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: titlePrompt }],
          max_tokens: 100,
          temperature: 0.3,
        }),
      });

      if (titleResponse.ok) {
        const titleData = await titleResponse.json();
        const generatedTitle = titleData.choices[0].message.content.trim();

        await conversationRef.update({
          title: generatedTitle,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error("Error updating conversation title:", error);
  }
}
