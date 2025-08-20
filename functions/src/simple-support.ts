// functions/src/simple-support.ts
// Simplified support system using LangChain

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JiraService } from "./jira/service";

// Define the support state interface
export interface SupportState {
  userId: string;
  conversationId: string;
  issue: string;
  attempts: number;
  solutions: string[];
  userFeedback: string[];
  currentStage: "analyzing" | "troubleshooting" | "escalating" | "creating_ticket" | "completed" | "collecting_info" | "requesting_permission" | "general_chat" | "checking_jira";
  lastMessage: string;
  jiraConnected: boolean;
  response?: string;
  ticketDetails?: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
    category: string;
  };
  // New fields for system information
  systemInfo?: {
    os?: string;
    ram?: string;
    storage?: string;
    deviceAge?: string;
    deviceType?: string;
  };
  ticketPermission?: boolean; // User's permission to create ticket
}

// Create the support system
export class SimpleSupportSystem {
  private llm: ChatOpenAI;

  constructor(openaiApiKey: string) {
    this.llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: "gpt-4o",
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  // Main method to process user message and determine response
  async processMessage(state: SupportState): Promise<SupportState> {
    try {
      // Update state with new message
      state.lastMessage = state.lastMessage;
      state.userFeedback = [...state.userFeedback, state.lastMessage];

      // Determine the next action based on current state and message
      const nextAction = this.determineNextAction(state);
      
      switch (nextAction) {
        case "analyze":
          return await this.analyzeIssue(state);
        case "provide_solution":
          return await this.provideSolution(state);
        case "escalate":
          return await this.escalateToTicket(state);
        case "create_ticket":
          return await this.createTicket(state);
        case "check_jira":
          return await this.checkJiraStatus(state);
        case "general_chat":
          return await this.handleGeneralChat(state);
        case "collect_info":
          return await this.collectSystemInfo(state);
        case "request_permission":
          return await this.requestTicketPermission(state);
        default:
          return await this.provideSolution(state);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        ...state,
        currentStage: "completed",
        response: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        ticketDetails: undefined // No ticket details on error
      } as SupportState;
    }
  }

  // Determine what action to take next
  private determineNextAction(state: SupportState): "analyze" | "provide_solution" | "escalate" | "create_ticket" | "check_jira" | "general_chat" | "collect_info" | "request_permission" {
    const lastMessage = state.lastMessage.toLowerCase();
    
    // Check for Jira-related questions
    if (lastMessage.includes("jira") || 
        lastMessage.includes("connected") || 
        lastMessage.includes("connection") ||
        lastMessage.includes("am i connected")) {
      return "check_jira";
    }
    
    // Check for general greetings or non-IT requests - redirect them
    if (lastMessage.includes("hi") || 
        lastMessage.includes("hello") || 
        lastMessage.includes("hey") ||
        lastMessage.includes("how are you") ||
        lastMessage.includes("what's up") ||
        lastMessage.length < 10) {
      return "general_chat";
    }
    
    // Check if we need to collect system information first
    if (!state.systemInfo?.os && state.attempts === 0) {
      return "collect_info";
    }
    
    // Check if user has given permission to create ticket
    if (state.ticketPermission === true) {
      return "create_ticket";
    }
    
    // Check if user is responding to permission request
    if (state.currentStage === "requesting_permission") {
      if (lastMessage.includes("yes") || 
          lastMessage.includes("okay") || 
          lastMessage.includes("sure") ||
          lastMessage.includes("create") ||
          lastMessage.includes("please")) {
        return "create_ticket";
      } else if (lastMessage.includes("no") || 
                 lastMessage.includes("not now") || 
                 lastMessage.includes("later")) {
        return "provide_solution"; // Continue troubleshooting
      }
    }
    
    // Check if user wants to escalate and we should request permission
    if (lastMessage.includes("can't solve") || 
        lastMessage.includes("not working") ||
        lastMessage.includes("still can't") ||
        lastMessage.includes("tried these") ||
        lastMessage.includes("doesn't work") ||
        state.attempts >= 3) {
      
      if (state.jiraConnected) {
        return "request_permission";
      } else {
        return "escalate";
      }
    }
    
    // If this is the first message with system info, analyze the issue
    if (state.attempts === 0 && state.systemInfo?.os) {
      return "analyze";
    }
    
    // Otherwise, provide a solution
    return "provide_solution";
  }

  // Handle general chat and greetings
  private async handleGeneralChat(state: SupportState): Promise<SupportState> {
    const prompt = PromptTemplate.fromTemplate(`
      You are a helpful AI assistant for an IT support platform. The user has sent a greeting or general message.
      
      User message: {message}
      
      Respond warmly and ask how you can help them. Mention that you can help with:
      - IT support and troubleshooting
      - Checking Jira connection status
      - Creating support tickets
      - General questions about the platform
      
      Be friendly and professional.
    `);

    const formattedPrompt = await prompt.format({
      message: state.lastMessage
    });

    const response = await this.llm.invoke(formattedPrompt);

    return {
      ...state,
      currentStage: "general_chat",
      response: response.content as string,
      ticketDetails: undefined
    };
  }

  // Check Jira connection status
  private async checkJiraStatus(state: SupportState): Promise<SupportState> {
    const prompt = PromptTemplate.fromTemplate(`
      You are an AI assistant for an IT support platform. The user is asking about their Jira connection status.
      
      User message: {message}
      Current Jira connection status: {jiraConnected}
      
      If Jira is connected: Inform them that they are connected and can create support tickets.
      If Jira is NOT connected: Explain that they need to connect their Jira account first to create tickets.
      
      Be helpful and guide them on next steps.
    `);

    const formattedPrompt = await prompt.format({
      message: state.lastMessage,
      jiraConnected: state.jiraConnected ? "Connected" : "Not connected"
    });

    const response = await this.llm.invoke(formattedPrompt);

    return {
      ...state,
      currentStage: "checking_jira",
      response: response.content as string,
      ticketDetails: undefined
    };
  }

  // Analyze the issue
  private async analyzeIssue(state: SupportState): Promise<SupportState> {
    const prompt = PromptTemplate.fromTemplate(`
      You are an IT support specialist. Analyze the user's issue and provide initial guidance.
      
      Issue: {issue}
      
      Provide a brief analysis of the problem and suggest the first troubleshooting step.
      Be clear, professional, and helpful. Keep it concise.
    `);

    const formattedPrompt = await prompt.format({
      issue: state.issue
    });

    const response = await this.llm.invoke(formattedPrompt);

    return {
      ...state,
      currentStage: "analyzing",
      attempts: state.attempts + 1,
      solutions: [...state.solutions, response.content as string],
      response: response.content as string,
      ticketDetails: undefined // No ticket needed at this stage
    };
  }

  // Provide troubleshooting solution
  private async provideSolution(state: SupportState): Promise<SupportState> {
    const prompt = PromptTemplate.fromTemplate(`
      You are an IT support specialist. Provide step-by-step troubleshooting steps for the user's issue.
      
      Issue: {issue}
      Previous attempts: {attempts}
      Previous solutions: {previousSolutions}
      
      Provide 2-3 clear, actionable troubleshooting steps. Be specific and technical.
      Format your response with numbered steps and clear instructions.
    `);

    const formattedPrompt = await prompt.format({
      issue: state.issue,
      attempts: state.attempts,
      previousSolutions: state.solutions.join(", ") || "None"
    });

    const response = await this.llm.invoke(formattedPrompt);

    return {
      ...state,
      currentStage: "troubleshooting",
      attempts: state.attempts + 1,
      solutions: [...state.solutions, response.content as string],
      response: response.content as string,
      ticketDetails: undefined // No ticket needed at this stage
    };
  }

  // Escalate to ticket creation (when Jira not connected)
  private async escalateToTicket(state: SupportState): Promise<SupportState> {
    const prompt = PromptTemplate.fromTemplate(`
      You are an IT support specialist. The user needs a support ticket, but Jira is not connected.
      
      Issue: {issue}
      Attempts: {attempts}
      Solutions tried: {solutions}
      
      Explain that you need to connect to Jira to create a support ticket.
      Provide a clear explanation of why a ticket is needed and guide them to connect their Jira account.
      Be helpful and professional.
    `);

    const formattedPrompt = await prompt.format({
      issue: state.issue,
      attempts: state.attempts,
      solutions: state.solutions.join(", ")
    });

    const response = await this.llm.invoke(formattedPrompt);

    return {
      ...state,
      currentStage: "escalating",
      response: response.content as string,
      ticketDetails: {
        title: `Support needed: ${state.issue}`,
        description: `Issue: ${state.issue}\n\nAttempts: ${state.attempts}\n\nSolutions tried:\n${state.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nUser feedback: ${state.userFeedback.join(', ')}`,
        priority: this.determinePriority(state.attempts) as "low" | "medium" | "high" | "critical",
        category: this.determineCategory(state.issue)
      }
    };
  }

  // Create Jira ticket
  private async createTicket(state: SupportState): Promise<SupportState> {
    try {
      // Prepare ticket details
      const ticketDetails = {
        title: `Support needed: ${state.issue}`,
        description: `Issue: ${state.issue}\n\nAttempts: ${state.attempts}\n\nSolutions tried:\n${state.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nUser feedback: ${state.userFeedback.join(', ')}`,
        priority: this.determinePriority(state.attempts) as "low" | "medium" | "high" | "critical",
        category: this.determineCategory(state.issue)
      };

      // Create the ticket using your existing Jira service
      const projectName = await JiraService.createJiraTicket(state.userId, ticketDetails);

      const prompt = PromptTemplate.fromTemplate(`
        You are an IT support specialist. You have successfully created a Jira ticket for the user.
        
        Ticket details:
        - Title: {title}
        - Priority: {priority}
        - Category: {category}
        - Project: {project}
        
        Inform the user that the ticket has been created and provide them with the details.
        Be professional and reassuring that the issue will be addressed by the support team.
      `);

      const formattedPrompt = await prompt.format({
        title: ticketDetails.title,
        priority: ticketDetails.priority,
        category: ticketDetails.category,
        project: projectName
      });

      const response = await this.llm.invoke(formattedPrompt);

      return {
        ...state,
        currentStage: "completed",
        ticketDetails,
        response: response.content as string
      };

    } catch (error) {
      console.error("Error creating ticket:", error);
      
      return {
        ...state,
        currentStage: "completed",
        response: `I encountered an error while creating the ticket: ${error instanceof Error ? error.message : 'Unknown error'}. Please contact support directly or try again later.`
      };
    }
  }

  // Helper function to determine ticket priority
  private determinePriority(attempts: number): "low" | "medium" | "high" | "critical" {
    if (attempts >= 3) return "high";
    if (attempts >= 2) return "medium";
    return "low";
  }

  // Helper function to determine ticket category
  private determineCategory(issue: string): string {
    const lowerIssue = issue.toLowerCase();
    
    if (lowerIssue.includes("camera") || lowerIssue.includes("webcam") || lowerIssue.includes("hardware")) {
      return "Hardware";
    }
    
    if (lowerIssue.includes("zoom") || lowerIssue.includes("software") || lowerIssue.includes("app")) {
      return "Software";
    }
    
    if (lowerIssue.includes("network") || lowerIssue.includes("internet") || lowerIssue.includes("connection")) {
      return "Network";
    }
    
    if (lowerIssue.includes("password") || lowerIssue.includes("login") || lowerIssue.includes("access")) {
      return "Security";
    }
    
    return "Technical Support";
  }

  // Collect system information from the user
  private async collectSystemInfo(state: SupportState): Promise<SupportState> {
    const prompt = PromptTemplate.fromTemplate(`
      You are an IT support specialist. The user needs to provide system information before you can help them.
      
      Issue: {issue}
      
      Please ask the user to provide the following system details:
      1. **Operating System**: What OS are you using? (Windows, macOS, Linux, iOS, Android)
      2. **RAM**: How much RAM does your device have? (e.g., 8GB, 16GB, 32GB)
      3. **Storage**: What type and size storage? (e.g., 256GB SSD, 1TB HDD)
      4. **Device Age**: How old is your device? (e.g., 1 year, 2 years, 6 months)
      5. **Device Type**: What type of device? (Laptop, Desktop, Tablet, Phone)
      
      Be friendly and explain that this information helps you provide better troubleshooting steps.
      Ask them to provide these details so you can assist them effectively.
    `);

    const formattedPrompt = await prompt.format({
      issue: state.issue
    });

    const response = await this.llm.invoke(formattedPrompt);

    return {
      ...state,
      currentStage: "collecting_info",
      response: response.content as string,
      ticketDetails: undefined
    };
  }

  // Request ticket permission from the user
  private async requestTicketPermission(state: SupportState): Promise<SupportState> {
    const prompt = PromptTemplate.fromTemplate(`
      You are an IT support specialist. The user has been unable to resolve their issue despite multiple troubleshooting attempts.
      
      Issue: {issue}
      Attempts: {attempts}
      Solutions tried: {solutions}
      
      It's time to escalate this to a support ticket. Please:
      1. Acknowledge their efforts in troubleshooting
      2. Explain that creating a support ticket will ensure their issue gets proper attention
      3. Ask for their permission: "Would you like me to create a support ticket for you?"
      4. Explain that the ticket will include all the troubleshooting steps already tried
      
      Be supportive and professional. Make it clear that this is the next logical step.
    `);

    const formattedPrompt = await prompt.format({
      issue: state.issue,
      attempts: state.attempts,
      solutions: state.solutions.join(", ")
    });

    const response = await this.llm.invoke(formattedPrompt);

    return {
      ...state,
      currentStage: "requesting_permission",
      response: response.content as string,
      ticketDetails: {
        title: `Support needed: ${state.issue}`,
        description: `Issue: ${state.issue}\n\nAttempts: ${state.attempts}\n\nSolutions tried:\n${state.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nUser feedback: ${state.userFeedback.join(', ')}`,
        priority: this.determinePriority(state.attempts) as "low" | "medium" | "high" | "critical",
        category: this.determineCategory(state.issue)
      }
    };
  }
}