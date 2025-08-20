// functions/src/jira/handlers.ts
// Jira tool call handlers

import { JiraService } from "./service";
import { JiraProject } from "./types";

// Handle Jira OAuth connection initiation
export async function handleConnectJiraOAuth(args: any, userId: string): Promise<string> {
  try {
    const { reason } = args;
    console.log(`User ${userId} wants to connect to Jira. Reason: ${reason}`);
    
    // Save connection status to Firestore
    await JiraService.saveJiraConnection(userId, '', '', 0, '', []);

    return `🔗 **Connect to Jira**\n\nI need to connect to your Jira account to create tickets. Click the button below to securely connect via OAuth.\n\n**What happens next:**\n1. You'll be redirected to Atlassian to authorize\n2. After authorization, you'll return here\n3. I'll be able to create tickets automatically\n\n**Note:** This connection will be saved and persist across your future logins.`;
  } catch (error) {
    console.error('Error connecting to Jira:', error);
    return `❌ Error initiating Jira connection: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Handle Jira connection status check and ticket confirmation
export async function handleCheckJiraConnection(args: any, userId: string): Promise<string> {
  try {
    const { action, ticket_details } = args;
    
    if (action === 'check_status') {
      const connection = await JiraService.getJiraConnection(userId);
      
      if (!connection || connection.status !== 'connected') {
        return `🔗 **Jira Connection Required**\n\nI need to connect to your Jira account to create this ticket. Please click the button below to connect securely via OAuth.\n\n**Note:** This will redirect you to Atlassian to authorize the connection. Once connected, I'll be able to create tickets automatically.`;
      }
      
      const availableProjects = connection.availableProjects || [];
      const currentProject = connection.defaultProject || availableProjects[0];
      
      let response = `✅ **Jira Connected!**\n\nGreat! Your Jira account is connected and ready.`;
      
      if (availableProjects.length > 1) {
        response += `\n\n**Available Projects:**\n${availableProjects.map((p: JiraProject) => 
          `• ${p.name}${p.cloudId === currentProject?.cloudId ? ' (Current)' : ''}`
        ).join('\n')}`;
        
        response += `\n\n**Current Project:** ${currentProject?.name}\n\nYou can ask me to switch to a different project anytime.`;
      } else {
        response += `\n\n**Project:** ${currentProject?.name}`;
      }
      
      response += `\n\nI can now create tickets for you when needed. **Since you're connected, would you like me to create a ticket for your current issue?** Just let me know and I'll gather the details from our conversation.`;
      
      return response;
      
    } else if (action === 'confirm_ticket_creation') {
      if (!ticket_details) {
        return `❌ Ticket details are required for confirmation.`;
      }
      
      const { title, description, priority, category } = ticket_details;
      
      return `🎫 **Confirm Ticket Creation**\n\nI'm ready to create a Jira ticket with the following details:\n\n**Title:** ${title}\n**Priority:** ${priority}\n**Category:** ${category}\n**Description:** ${description}\n\nPlease confirm if you want me to create this ticket. Once confirmed, it will be sent to your IT support team.`;
    }
    
    return `❌ Invalid action specified.`;
  } catch (error) {
    console.error('Error checking Jira connection:', error);
    return `❌ Error checking Jira connection: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Handle Jira ticket creation
export async function handleCreateJiraTicket(args: any, userId: string): Promise<string> {
  try {
    const connection = await JiraService.getJiraConnection(userId);
    
    if (!connection || connection.status !== 'connected') {
      return `🔗 **Jira Connection Required**\n\nI need to connect to your Jira account to create this ticket. Please click the button below to connect securely via OAuth.\n\n**Note:** This will redirect you to Atlassian to authorize the connection. Once connected, I'll be able to create tickets automatically.`;
    }

    const projectName = await JiraService.createJiraTicket(userId, {
      title: args.title,
      description: args.description,
      priority: args.priority,
      category: args.category,
    });

    return `✅ I've created a Jira ticket in **${projectName}**:\n\n**Title:** ${args.title}\n**Priority:** ${args.priority}\n**Category:** ${args.category}\n**Project:** ${projectName}\n\n**Description:** ${args.description}\n\nThe ticket has been created and assigned to your IT support team. They will review it and get back to you soon.`;
    
  } catch (error) {
    console.error('Error creating Jira ticket:', error);
    return `❌ Error creating Jira ticket: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Handle project selection
export async function handleSelectJiraProject(args: any, userId: string): Promise<string> {
  try {
    const { project_name } = args;
    
    const selectedProject = await JiraService.updateDefaultProject(userId, project_name);
    
    if (!selectedProject) {
      const availableProjects = await JiraService.getAvailableProjects(userId);
      const projectNames = availableProjects.map(p => p.name).join(', ');
      return `❌ Project "${project_name}" not found. Available projects: ${projectNames}`;
    }
    
    return `✅ **Project Selected: ${selectedProject.name}**\n\nI'll now create tickets in the **${selectedProject.name}** project.\n\n**Project URL:** ${selectedProject.url}\n\nYou can change this anytime by asking me to select a different project.`;
    
  } catch (error) {
    console.error('Error selecting Jira project:', error);
    return `❌ Error selecting project: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
