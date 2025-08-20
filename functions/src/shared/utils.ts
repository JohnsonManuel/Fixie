// functions/src/shared/utils.ts
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const db = getFirestore();
const auth = getAuth();

// Common authentication utility
export async function verifyUserToken(idToken: string) {
  if (!idToken) {
    throw new Error("No ID token provided");
  }
  
  const decodedToken = await auth.verifyIdToken(idToken);
  return decodedToken.uid;
}

// Common database operations
export async function getConversationData(userId: string, conversationId: string) {
  const conversationRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId);
  const conversationDoc = await conversationRef.get();
  
  if (!conversationDoc.exists) {
    throw new Error("Conversation not found");
  }
  
  return conversationDoc.data();
}

export async function getJiraConnectionStatus(userId: string) {
  const jiraConnectionRef = db.collection("users").doc(userId).collection("platform-connections").doc("jira");
  const jiraConnectionSnap = await jiraConnectionRef.get();
  
  return {
    exists: jiraConnectionSnap.exists,
    connected: jiraConnectionSnap.exists && jiraConnectionSnap.data()?.status === 'connected',
    data: jiraConnectionSnap.exists ? jiraConnectionSnap.data() : null
  };
}

export async function addMessageToConversation(
  userId: string, 
  conversationId: string, 
  message: { role: string; content: string; [key: string]: any }
) {
  const messagesRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId).collection("messages");
  
  return await messagesRef.add({
    ...message,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function updateConversation(
  userId: string, 
  conversationId: string, 
  updates: { [key: string]: any }
) {
  const conversationRef = db.collection("users").doc(userId).collection("conversations").doc(conversationId);
  
  return await conversationRef.update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// Common error handling
export function createErrorResponse(error: any, defaultMessage: string = "An error occurred") {
  console.error("Function error:", error);
  
  return {
    error: defaultMessage,
    details: error instanceof Error ? error.message : "Unknown error"
  };
}

// Common response helpers
export function createSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    data,
    message: message || "Operation completed successfully"
  };
}

// Validation utilities
export function validateRequiredFields(body: any, requiredFields: string[]) {
  const missingFields = requiredFields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

// Configuration constants
export const REGION = "europe-west3";
export const DEFAULT_TIMEOUT = 60;
export const DEFAULT_MEMORY = "256MiB";
