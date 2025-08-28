// functions/src/index.ts
// Main entry point - exports only chat functionality

// Initialize Firebase Admin (only once)
import { initializeApp } from "firebase-admin/app";
initializeApp();

// Export only chat function
export { chat } from "./chat";
