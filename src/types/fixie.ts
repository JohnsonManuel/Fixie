export type View = 'chat' | 'users' | 'integrations' | 'tickets' | 'approvals';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  photo_url: string | null;
  is_admin: boolean;
}

export interface AppOrg {
  id: string;
  name: string;
  slug: string;
  integrations: Integration[];
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  requires_approval: boolean;
  tools: { name: string; description: string }[];
}

export interface Conversation {
  id: string;
  title: string;
  message_count: number;
  last_message_at: string;
  status?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface PendingConfirmation {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_use_id: string;
  integration_id: string;
  server_name: string;
  requires_approval: boolean;
  conversation_snapshot: unknown;
}

export interface ToolSchema {
  name: string;
  description: string;
  admin_only?: boolean;
  read_only?: boolean;
  input_schema: Record<string, unknown>;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  server_type: string;
  server_url: string | null;
  credentials: Record<string, string>;
  tool_schemas: ToolSchema[];
  tool_count: number;
  tools: string[];
  routing_hint: string | null;
  requires_approval: boolean;
  is_active: boolean;
  created_at: string;
  nango_connection_id: string | null;
  nango_provider_config_key: string | null;
}

export interface OrgUser {
  id: string;
  email: string;
  name: string;
  photo_url: string | null;
  is_admin: boolean;
  email_domain: string | null;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  execution_result: Record<string, unknown> | null;
  final_response: string | null;
  reviewer_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  expires_at: string | null;
  conversation_id: string;
  integration_name?: string;
  server_type?: string;
}

export interface Ticket extends ApprovalRequest {}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}
