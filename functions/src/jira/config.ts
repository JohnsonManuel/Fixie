// functions/src/jira/config.ts
// Jira OAuth configuration

import { defineSecret } from "firebase-functions/params";

export const JIRA_CLIENT_ID = defineSecret("JIRA_CLIENT_ID");
export const JIRA_CLIENT_SECRET = defineSecret("JIRA_CLIENT_SECRET");

export const JIRA_OAUTH_CONFIG = {
  authorizeUrl: "https://auth.atlassian.com/authorize",
  tokenUrl: "https://auth.atlassian.com/oauth/token",
  scope: "read:jira-user write:jira-work offline_access",
  redirectUri: `https://europe-west10-jj-ai-platform.cloudfunctions.net/jiraOAuthCallback`,
};

export const JIRA_API_ENDPOINTS = {
  accessibleResources: "https://api.atlassian.com/oauth/token/accessible-resources",
  createIssue: (cloudId: string) => `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`,
};
