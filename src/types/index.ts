// Common types used throughout the application

export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt?: any; // Firestore Timestamp | Date
}

export type Conversation = {
  id: string;
  title?: string;
  updatedAt?: any;
  lastMessage?: string;
  createdAt?: any;
  model?: string;
};

export interface AuthError {
  code: string;
  message: string;
}

export interface LoginProps {
  onBackToHome?: () => void;
  onSwitchToSignup?: () => void;
}

export interface SignupProps {
  onBackToHome?: () => void;
  onSwitchToLogin?: () => void;
}
