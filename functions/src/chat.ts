// functions/src/chat.ts
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
import cors from 'cors';
import { CHAT_CONFIG } from './config';
import { createSupportTicket } from './ticket-tool';
import { FRESHWORKS_DOMAIN, FRESHWORKS_API_KEY } from './freshworks-integration';

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
    secrets: [OPENAI_API_KEY, FRESHWORKS_DOMAIN, FRESHWORKS_API_KEY],
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async (req: any, res: any) => {
    // Handle CORS preflight
    return new Promise((resolve, reject) => {
      corsHandler(req, res, async () => {
        try {
          console.log('Chat function called with method:', req.method);
          console.log('Request body:', req.body);
          console.log('Headers:', req.headers);

          // Verify authentication
          const idToken = req.body.idToken;
          if (!idToken) {
            console.log('No ID token provided');
            res.status(401).json({ 
              error: "No ID token provided",
              code: "AUTH_FAILED"
            });
            resolve();
            return;
          }

          const decodedToken = await auth.verifyIdToken(idToken);
          const userId = decodedToken.uid;
          console.log('User authenticated:', userId);
          console.log('User email:', decodedToken.email);

          // Get conversation ID and message
          const { conversationId, message } = req.body;
          if (!conversationId || !message) {
            console.log('Missing conversationId or message');
            res.status(400).json({ error: "Missing conversationId or message" });
            resolve();
            return;
          }

          console.log('Processing message:', message, 'for conversation:', conversationId);

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

          console.log('Generating AI response for message:', message);
          // Generate AI response using OpenAI with tool calling
          const aiResponse = await generateAIResponse(message, chatMsgs, userId, conversationId);
          console.log('AI response generated successfully');
          console.log('AI response length:', aiResponse.content.length);
          console.log('AI response preview:', aiResponse.content.substring(0, 200) + '...');

          // Check if we should offer interactive buttons (simplified)
          let interactiveButtons = null;
          const shouldOfferButtons = shouldOfferTicketCreationSimple(message, aiResponse.content, chatMsgs);
          console.log('Should offer buttons:', shouldOfferButtons);

          if (shouldOfferButtons) {
            interactiveButtons = {
              type: "ticket_offer",
              buttons: [
                {
                  id: "create_ticket",
                  label: "✅ Create Support Ticket",
                  action: "CREATE_TICKET",
                  style: "primary"
                },
                {
                  id: "cancel",
                  label: "❌ Try Other Solutions",
                  action: "CANCEL_TICKET",
                  style: "secondary"
                }
              ]
            };
          }

          // Save AI response to Firestore (user message already saved by frontend)
          const messageData: any = {
            role: "assistant",
            content: aiResponse.content,
            createdAt: FieldValue.serverTimestamp(),
          };

          // Add interactive buttons to message if applicable
          if (interactiveButtons) {
            messageData.interactive = interactiveButtons;
          }

          // Add tool call information if present
          if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
            messageData.toolCalls = aiResponse.toolCalls;
          }

          console.log('Saving AI response to Firestore');
          console.log('Message data to save:', JSON.stringify(messageData, null, 2));
          const aiMessageRef = await messagesRef.add(messageData);
          console.log('AI message saved with ID:', aiMessageRef.id);

          // Update conversation metadata
          const conversationRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId);
          await conversationRef.update({
            lastMessage: message,
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log('Conversation metadata updated');

          // Generate/update conversation title if needed
          await updateConversationTitle(userId, conversationId, chatMsgs);
          console.log('Conversation title updated');

          console.log('Returning success response');
          // Return success response with interactive elements
          res.json({
            success: true,
            messageId: aiMessageRef.id,
            content: aiResponse.content,
            conversationId: conversationId,
            toolCalls: aiResponse.toolCalls || [],
            interactive: interactiveButtons
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

// Simple function to check if ticket creation should be offered
function shouldOfferTicketCreationSimple(userMessage: string, aiResponse: string, conversationHistory: any[]): boolean {
  try {
    const escalationKeywords = [
      'escalate', 'ticket', 'support team', 'human', 'manager', 'supervisor',
      'create ticket', 'open ticket', 'submit ticket', 'support request'
    ];
    
    const unresolvedKeywords = [
      'not working', 'still broken', "didn't work", "doesn't help",
      'tried everything', 'nothing works', 'still having issues'
    ];
    
    const messageLower = userMessage.toLowerCase();
    const responseLower = aiResponse.toLowerCase();
    
    // Check for explicit escalation requests
    const hasEscalationRequest = escalationKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    
    // Check for unresolved issues
    const hasUnresolvedIssue = unresolvedKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    
    // Check if AI response mentions escalation
    const aiMentionsEscalation = responseLower.includes('escalate') || 
                                responseLower.includes('support team') ||
                                responseLower.includes('ticket');
    
    // Check conversation length (longer conversations might need escalation)
    const isLongConversation = conversationHistory.length > 4;
    
    return hasEscalationRequest || (hasUnresolvedIssue && isLongConversation) || aiMentionsEscalation;
  } catch (error) {
    console.error('Error in shouldOfferTicketCreationSimple:', error);
    return false;
  }
}

// Enhanced AI response generation using OpenAI with tool calling
async function generateAIResponse(
  userMessage: string, 
  conversationHistory: any[], 
  userId: string, 
  conversationId: string
): Promise<{ content: string; toolCalls?: any[] }> {
  try {
    // Check if we have an OpenAI API key
    const apiKey = OPENAI_API_KEY.value();
    if (!apiKey) {
      console.log('No OpenAI API key, using fallback response');
      // Fallback to simple responses if no API key
      return { content: generateSimpleResponse(userMessage) };
    }

    console.log('Generating AI response with OpenAI');

    // Prepare conversation context for OpenAI
    const messages = [
      {
        role: "system",
        content: CHAT_CONFIG.systemPrompt
      },
      ...conversationHistory.slice(-10) // Keep last 10 messages for context
    ];

    // Prepare API request with tools
    const requestBody: any = {
      model: CHAT_CONFIG.model,
      messages: messages,
      max_tokens: CHAT_CONFIG.maxTokens,
      temperature: CHAT_CONFIG.temperature,
    };

    // Add tools if enabled
    if (CHAT_CONFIG.enableTools) {
      requestBody.tools = CHAT_CONFIG.tools;
      requestBody.tool_choice = "auto"; // Let AI decide when to use tools
    }

    console.log('Calling OpenAI API with model:', CHAT_CONFIG.model);

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    console.log('OpenAI response received, checking for tool calls');
    
    // Handle tool calls
    if (choice.message.tool_calls) {
      console.log('AI requested tool calls:', choice.message.tool_calls.length);
      
      // Execute tool calls
      const toolResults = await executeToolCalls(choice.message.tool_calls, userId, conversationId);
      
      // Add tool call results to conversation and get final response
      const messagesWithTools = [
        ...messages,
        choice.message, // AI's message with tool calls
        ...toolResults.map(result => ({
          role: "tool",
          tool_call_id: result.toolCallId,
          content: JSON.stringify(result.result)
        }))
      ];

      console.log('Getting final response after tool execution');

      // Get final response after tool execution
      const finalResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: CHAT_CONFIG.model,
          messages: messagesWithTools,
          max_tokens: CHAT_CONFIG.maxTokens,
          temperature: CHAT_CONFIG.temperature,
        }),
      });

      if (!finalResponse.ok) {
        throw new Error(`OpenAI final response error: ${finalResponse.status}`);
      }

      const finalData = await finalResponse.json();
      const finalChoice = finalData.choices[0];
      
      return {
        content: finalChoice.message.content,
        toolCalls: choice.message.tool_calls
      };
    }

    console.log('No tool calls, returning regular response');
    // No tool calls, return regular response
    return {
      content: choice.message.content.trim()
    };

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Fallback to simple responses
    return { content: generateSimpleResponse(userMessage) };
  }
}

// Execute tool calls requested by AI
async function executeToolCalls(toolCalls: any[], userId: string, conversationId: string): Promise<any[]> {
  const results = [];

  for (const toolCall of toolCalls) {
    try {
      console.log(`Executing tool: ${toolCall.function.name}`);
      
      if (toolCall.function.name === "createSupportTicket") {
        const args = JSON.parse(toolCall.function.arguments);
        const ticketResult = await createSupportTicket({
          ...args,
          userId,
          conversationId
        });
        
        results.push({
          toolCallId: toolCall.id,
          result: ticketResult
        });
        
        console.log(`Ticket creation result:`, ticketResult);
      } else {
        // Unknown tool
        results.push({
          toolCallId: toolCall.id,
          result: {
            success: false,
            message: `Unknown tool: ${toolCall.function.name}`,
            error: "Tool not implemented"
          }
        });
      }
    } catch (error) {
      console.error(`Error executing tool ${toolCall.function.name}:`, error);
      results.push({
        toolCallId: toolCall.id,
        result: {
          success: false,
          message: "Tool execution failed",
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });
    }
  }

  return results;
}

// Fallback simple response generator
function generateSimpleResponse(userMessage: string): string {
  const responses = [
    "I understand your IT support request. How can I help you further?",
    "Thank you for your technical inquiry. Is there anything specific you'd like me to assist with?",
    "I'm here to help with your IT issues! Could you provide more details about the technical problem?",
    "That's an interesting technical challenge. Let me know if you have any specific IT questions or need assistance.",
    "I appreciate you reaching out for IT support. How can I be of technical assistance today?"
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