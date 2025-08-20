// functions/src/jira/types.ts
// Jira-related type definitions

export interface JiraProject {
  cloudId: string;
  name: string;
  url: string;
  avatarUrl?: string;
  scopes?: string[];
}

export interface JiraConnection {
  status: 'connecting' | 'connected' | 'failed';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  availableProjects?: JiraProject[];
  defaultProject?: JiraProject;
  connectedAt?: Date;
  updatedAt?: Date;
  reason?: string;
}

export interface JiraTicket {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  project?: string;
  projectId?: string;
  status: 'created' | 'in_progress' | 'resolved';
  timestamp: Date;
}

export interface OAuthState {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  conversationId?: string;
  timestamp: Date;
  expiresAt: Date;
}

export interface JiraOAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  redirectUri: string;
}
