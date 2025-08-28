// functions/src/chat.ts
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
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

// Enhanced chat function with proper AI integration
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
            res.status(401).json({ 
              error: "No ID token provided",
              code: "AUTH_FAILED"
            });
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

          // Build conversation context for AI
          const chatMsgs: any[] = [];
          snap.docs.forEach((doc: any) => {
            const msgData = doc.data();
            chatMsgs.push({
              role: msgData.role,
              content: msgData.content,
            });
          });

          // Add the current user message to context
          chatMsgs.push({
            role: "user",
            content: message,
          });

          // Generate AI response using OpenAI
          const aiResponse = await generateAIResponse(message, chatMsgs);

          // Save AI response to Firestore (user message already saved by frontend)
          const aiMessageRef = await messagesRef.add({
            role: "assistant",
            content: aiResponse,
            createdAt: FieldValue.serverTimestamp(),
          });

          // Update conversation metadata
          const conversationRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId);
          await conversationRef.update({
            lastMessage: message,
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Generate/update conversation title if needed
          await updateConversationTitle(userId, conversationId, chatMsgs);

          // Return success response
          res.json({
            success: true,
            messageId: aiMessageRef.id,
            content: aiResponse,
            conversationId: conversationId
          });

        } catch (error) {
          console.error('Error in chat function:', error);
          
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
            error: "Sorry, I encountered an error. Please try again.",
            details: error instanceof Error ? error.message : "Unknown error"
          });
        } finally {
          resolve();
        }
      });
    });
  }
);

// Enhanced AI response generation using OpenAI
async function generateAIResponse(userMessage: string, conversationHistory: any[]): Promise<string> {
  try {
    // Check if we have an OpenAI API key
    const apiKey = OPENAI_API_KEY.value();
    if (!apiKey) {
      // Fallback to simple responses if no API key
      return generateSimpleResponse(userMessage);
    }

    // Prepare conversation context for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are Fixie, an AI-powered IT support specialist. You help users with technical IT issues and computer-related problems. Be helpful, professional, and provide actionable solutions. Keep responses concise but informative.`
      },
      ...conversationHistory.slice(-10) // Keep last 10 messages for context
    ];

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Fallback to simple responses
    return generateSimpleResponse(userMessage);
  }
}

// Fallback simple response generator
function generateSimpleResponse(userMessage: string): string {
  const responses = [
    "I understand your message. How can I help you further?",
    "Thank you for sharing that. Is there anything specific you'd like me to assist with?",
    "I'm here to help! Could you provide more details about what you need?",
    "That's interesting. Let me know if you have any questions or need assistance.",
    "I appreciate you reaching out. How can I be of service today?"
  ];
  
  // Simple response selection based on message length
  const responseIndex = userMessage.length % responses.length;
  return responses[responseIndex];
}

// Update conversation title function
async function updateConversationTitle(userId: string, conversationId: string, chatMsgs: any[]): Promise<void> {
  try {
    const conversationRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId);
    const conversationDoc = await conversationRef.get();
    
    if (!conversationDoc.exists) return;

    const conversationData = conversationDoc.data();
    const shouldUpdateTitle = !conversationData?.title || 
                             conversationData.title === "New Chat" ||
                             chatMsgs.length % 10 === 0; // Update every 10 messages

    if (shouldUpdateTitle) {
      const titlePrompt = `Generate a concise, descriptive title for this IT support conversation. The title should:
- Be 3-8 words maximum
- Clearly indicate the main issue
- Be professional and technical
- Help users identify the conversation later

Conversation:
${chatMsgs.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Title:`;

      try {
        const apiKey = OPENAI_API_KEY.value();
        if (apiKey) {
          const titleResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
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
        console.error('Error generating title:', error);
        // Continue without updating title
      }
    }
  } catch (error) {
    console.error('Error updating conversation title:', error);
  }
}
