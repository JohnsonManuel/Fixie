// functions/src/freshworks-integration.ts
// Freshworks API integration for ticket creation

import { defineSecret } from "firebase-functions/params";

// Define secrets for Freshworks credentials
export const FRESHWORKS_DOMAIN = defineSecret("FRESHWORKS_DOMAIN");
export const FRESHWORKS_API_KEY = defineSecret("FRESHWORKS_API_KEY");

export interface FreshworksTicketData {
  subject: string;
  description: string;
  priority: number; // 1=Low, 2=Medium, 3=High, 4=Urgent
  status: number; // 2=Open, 3=Pending, 4=Resolved, 5=Closed
  source: number; // 1=Email, 2=Portal, 3=Phone, 4=Forum, 5=Twitter, 6=Facebook, 7=Chat
  type?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  email: string;
}

export interface FreshworksTicketResponse {
  success: boolean;
  ticketId?: number;
  ticketNumber?: string;
  message: string;
  error?: string;
  freshworksData?: any;
}

// Priority mapping from our system to Freshworks
const PRIORITY_MAPPING = {
  'low': 1,
  'medium': 2,
  'high': 3,
  'urgent': 4
};

// Category mapping to Freshworks ticket types
const CATEGORY_MAPPING: Record<string, string> = {
  'Hardware Issues': 'Hardware',
  'Software Problems': 'Software',
  'Network Connectivity': 'Network',
  'Email & Communication': 'Email',
  'Security Concerns': 'Security',
  'System Administration': 'System Admin',
  'User Account Issues': 'User Account',
  'General IT Support': 'General'
};

/**
 * Create a ticket in Freshworks Freshdesk/Freshservice
 */
export async function createFreshworksTicket(
  params: {
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    userId: string;
    conversationId: string;
    email:string;
  }
): Promise<FreshworksTicketResponse> {
  try {
    console.log('Creating Freshworks ticket with params:', params);

    // Get credentials
    const domain = FRESHWORKS_DOMAIN.value();
    const apiKey = FRESHWORKS_API_KEY.value();

    if (!domain || !apiKey) {
      return {
        success: false,
        message: "Freshworks credentials not configured",
        error: "Missing FRESHWORKS_DOMAIN or FRESHWORKS_API_KEY"
      };
    }

    // Prepare ticket data for Freshworks API
    const ticketData: FreshworksTicketData = {
      subject: params.subject,
      description: params.description,
      priority: PRIORITY_MAPPING[params.priority] || 2, // Default to medium
      status: 2, // Open
      source: 2, // Portal
      type: CATEGORY_MAPPING[params.category] || 'General',
      tags: ['ai-generated', 'chat-support', `user-${params.userId}`],
      custom_fields: {
        cf_conversation_id: params.conversationId,
        cf_user_id: params.userId,
        cf_ai_generated: true
      },email: params.email
    };

    // Create the ticket via Freshworks API
    const response = await fetch(`https://${domain}/api/v2/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:X`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Freshworks API error:', response.status, errorData);
      
      return {
        success: false,
        message: "Failed to create ticket in Freshworks",
        error: `API Error ${response.status}: ${errorData}`
      };
    }

    const freshworksData = await response.json();
    console.log('Freshworks ticket created successfully:', freshworksData);

    return {
      success: true,
      ticketId: freshworksData.id,
      ticketNumber: freshworksData.display_id?.toString() || freshworksData.id?.toString(),
      message: `Support ticket created successfully in Freshworks! Ticket Number: ${freshworksData.display_id || freshworksData.id}. Our IT team will review your request and respond within 24 hours.`,
      freshworksData: freshworksData
    };

  } catch (error) {
    console.error('Error creating Freshworks ticket:', error);
    
    return {
      success: false,
      message: "Failed to create support ticket. Please try again or contact support directly.",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get ticket status from Freshworks
 */
export async function getFreshworksTicketStatus(ticketId: number): Promise<any> {
  try {
    const domain = FRESHWORKS_DOMAIN.value();
    const apiKey = FRESHWORKS_API_KEY.value();

    if (!domain || !apiKey) {
      throw new Error("Freshworks credentials not configured");
    }

    const response = await fetch(`https://${domain}/api/v2/tickets/${ticketId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:X`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching Freshworks ticket status:', error);
    throw error;
  }
}

/**
 * Update ticket in Freshworks
 */
export async function updateFreshworksTicket(
  ticketId: number, 
  updateData: Partial<FreshworksTicketData>
): Promise<any> {
  try {
    const domain = FRESHWORKS_DOMAIN.value();
    const apiKey = FRESHWORKS_API_KEY.value();

    if (!domain || !apiKey) {
      throw new Error("Freshworks credentials not configured");
    }

    const response = await fetch(`https://${domain}/api/v2/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:X`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error updating Freshworks ticket:', error);
    throw error;
  }
}
