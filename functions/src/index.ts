// functions/src/index.ts
// Main entry point - exports all separated functions

// Initialize Firebase Admin (only once)
import { initializeApp } from "firebase-admin/app";
initializeApp();

// Export separated functions
export { chat } from "./chat";
export { jiraOperations } from "./jira-operations";
export { toolOrchestrator } from "./tool-orchestrator";

// Export existing Jira OAuth functions
export { jiraOAuthStart, jiraOAuthCallback, jiraConnectionStatus } from "./jira-oauth";
export { testJiraSetup } from "./test-jira";
