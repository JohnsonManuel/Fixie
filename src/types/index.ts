// src/types/index.ts

export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: Date;
  
  // New fields for Interrupts (Human-in-the-loop)
  status?: "completed" | "requires_action" | "action_taken"; 
  toolName?: string;
  toolArgs?: Record<string, any>;
  toolCallId?: string;
  runId?: string;

  // Legacy / UI fields needed for ChatMessage.tsx
  actions?: any[];
  tool_results?: any[];
  toolCalls?: any[];
  interactive?: {
    type: string;
    buttons: Array<{
      id: string;
      label: string;
      action: string;
      style?: 'primary' | 'secondary' | 'danger';
    }>;
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

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