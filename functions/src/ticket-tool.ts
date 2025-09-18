// functions/src/ticket-tool.ts
// Ticket creation tool for GPT-4o function calling

import { createFreshworksTicket } from './freshworks-integration';

export interface TicketCreationParams {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  userId: string;
  conversationId: string;
  email:string;
}

export interface TicketCreationResult {
  success: boolean;
  ticketId?: string;
  ticketNumber?: string;
  message: string;
  error?: string;
}

// Main ticket creation function that GPT-4o will call
export async function createSupportTicket(params: TicketCreationParams): Promise<TicketCreationResult> {
  try {
    console.log('Creating support ticket with params:', params);

    // Validate required parameters
    if (!params.subject || !params.description || !params.userId) {
      return {
        success: false,
        message: "Missing required ticket information",
        error: "Missing subject, description, or userId"
      };
    }
    params.email = "john@example.com"
    // Create ticket in Freshworks
    console.log('Creating ticket in Freshworks...');
    const freshworksResult = await createFreshworksTicket(params);
    
    if (freshworksResult.success) {
      console.log('Freshworks ticket created successfully:', freshworksResult.ticketNumber);
      
      return {
        success: true,
        ticketId: freshworksResult.ticketId?.toString(),
        ticketNumber: freshworksResult.ticketNumber,
        message: freshworksResult.message
      };
    } else {
      console.log('Freshworks ticket creation failed:', freshworksResult.error);
      
      return {
        success: false,
        message: "Failed to create support ticket in Freshworks. Please try again or contact support directly.",
        error: freshworksResult.error
      };
    }

  } catch (error) {
    console.error('Error creating support ticket:', error);
    
    return {
      success: false,
      message: "Failed to create support ticket. Please try again or contact support directly.",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Tool definition for GPT-4o function calling
export const ticketCreationTool = {
  type: "function",
  function: {
    name: "createSupportTicket",
    description: "Create a support ticket when the user needs IT assistance that cannot be resolved through standard troubleshooting. Use this when the user explicitly requests ticket creation or when standard solutions don't work.",
    parameters: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "Brief, descriptive title of the IT issue (max 100 characters)"
        },
        description: {
          type: "string", 
          description: "Detailed description of the problem, what was tried, and current status"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Priority level based on impact: urgent (system down), high (major disruption), medium (minor issues), low (general questions)"
        },
        category: {
          type: "string",
          enum: [
            "Hardware Issues",
            "Software Problems", 
            "Network Connectivity",
            "Email & Communication",
            "Security Concerns",
            "System Administration",
            "User Account Issues",
            "General IT Support"
          ],
          description: "Category that best describes the type of IT issue"
        }
      },
      required: ["subject", "description", "priority", "category"]
    }
  }
};

// Helper function to determine if ticket creation should be offered
export function shouldOfferTicketCreation(userMessage: string, aiResponse: string, conversationHistory: any[]): boolean {
  const escalationKeywords = [
    'escalate', 'ticket', 'support team', 'human', 'manager', 'supervisor',
    'create ticket', 'open ticket', 'submit ticket', 'support request'
  ];
  
  const unresolvedKeywords = [
    'not working', 'still broken', 'didn\'t work', 'doesn\'t help',
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
}
