// functions/src/freshworks-integration.ts
// Freshworks API integration for ticket creation

import { defineSecret } from "firebase-functions/params";

// Firebase secrets kept as last-resort fallback only
export const FRESHWORKS_DOMAIN  = defineSecret("FRESHWORKS_DOMAIN");
export const FRESHWORKS_API_KEY = defineSecret("FRESHWORKS_API_KEY");

// Cloud Run backend base URL — same service the frontend talks to
const BACKEND_BASE = "https://fixie-chat-308405783967.us-central1.run.app";

export interface FreshworksTicketData {
  subject: string;
  description: string;
  priority: number; // 1=Low, 2=Medium, 3=High, 4=Urgent
  status: number;   // 2=Open, 3=Pending, 4=Resolved, 5=Closed
  source: number;   // 1=Email, 2=Portal, 3=Phone, 4=Forum, 5=Twitter, 6=Facebook, 7=Chat
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
  'low': 1, 'medium': 2, 'high': 3, 'urgent': 4
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
 * Fetch Freshdesk credentials from the integration settings stored in the
 * backend database.  Falls back to Firebase secrets if unavailable.
 */
export async function getFreshworksCredentials(idToken?: string): Promise<{ domain: string; apiKey: string } | null> {
  // 1. Try to get credentials from the backend integration settings
  if (idToken) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/integrations`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const integrations: any[] = await res.json();
        const freshdesk = integrations.find((i: any) =>
          i.server_type === 'freshdesk' ||
          (i.name && i.name.toLowerCase().includes('freshdesk'))
        );
        if (freshdesk?.credentials?.domain && freshdesk?.credentials?.api_key) {
          console.log('Using Freshdesk credentials from integration settings');
          return {
            domain:  freshdesk.credentials.domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            apiKey:  freshdesk.credentials.api_key,
          };
        }
      }
    } catch (err) {
      console.warn('Could not fetch integration credentials from backend:', err);
    }
  }

  // 2. Fall back to Firebase secrets
  const domain  = FRESHWORKS_DOMAIN.value();
  const apiKey  = FRESHWORKS_API_KEY.value();
  if (domain && apiKey) {
    console.log('Using Freshdesk credentials from Firebase secrets (fallback)');
    return { domain, apiKey };
  }

  return null;
}

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
    email: string;
    idToken?: string; // used to fetch dynamic credentials
  }
): Promise<FreshworksTicketResponse> {
  try {
    console.log('Creating Freshworks ticket for user:', params.userId);

    const creds = await getFreshworksCredentials(params.idToken);
    if (!creds) {
      return {
        success: false,
        message: "Freshdesk credentials not configured. Please add your Freshdesk integration in Settings → Integrations.",
        error: "No Freshdesk credentials available"
      };
    }

    const { domain, apiKey } = creds;

    const ticketData: FreshworksTicketData = {
      subject:     params.subject,
      description: params.description,
      priority:    PRIORITY_MAPPING[params.priority] || 2,
      status:      2, // Open
      source:      2, // Portal
      type:        CATEGORY_MAPPING[params.category] || 'General',
      tags:        ['ai-generated', 'chat-support', `user-${params.userId}`],
      custom_fields: {
        cf_conversation_id: params.conversationId,
        cf_user_id:         params.userId,
        cf_ai_generated:    true
      },
      email: params.email
    };

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
      console.error('Freshdesk API error:', response.status, errorData);
      return {
        success: false,
        message: `Failed to create ticket in Freshdesk (${response.status}). Check that your API key and domain are correct in Integrations settings.`,
        error: `API Error ${response.status}: ${errorData}`
      };
    }

    const freshworksData = await response.json();
    console.log('Freshdesk ticket created:', freshworksData.id);

    return {
      success: true,
      ticketId:     freshworksData.id,
      ticketNumber: freshworksData.display_id?.toString() || freshworksData.id?.toString(),
      message:      `Support ticket #${freshworksData.display_id || freshworksData.id} created successfully in Freshdesk. Our IT team will respond within 24 hours.`,
      freshworksData
    };

  } catch (error) {
    console.error('Error creating Freshdesk ticket:', error);
    return {
      success: false,
      message: "Failed to create support ticket. Please try again or contact support directly.",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get ticket status from Freshdesk
 */
export async function getFreshworksTicketStatus(ticketId: number, idToken?: string): Promise<any> {
  const creds = await getFreshworksCredentials(idToken);
  if (!creds) throw new Error("Freshdesk credentials not configured");

  const response = await fetch(`https://${creds.domain}/api/v2/tickets/${ticketId}`, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${creds.apiKey}:X`).toString('base64')}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error(`API Error ${response.status}`);
  return await response.json();
}
