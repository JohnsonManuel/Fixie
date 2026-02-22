// functions/src/index.ts
// Main entry point - exports only chat functionality

// Initialize Firebase Admin (only once)
import { initializeApp } from "firebase-admin/app";
initializeApp();

// Export chat function
export { chat } from "./chat";

// Export scheduled cleanup for unverified users (runs every 24 hours)
export { cleanupUnverifiedUsers } from "./cleanup-unverified-users";
