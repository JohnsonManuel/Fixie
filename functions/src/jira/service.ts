// functions/src/jira/service.ts
// Jira service layer for API interactions and data operations

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
import { 
  JiraConnection, 
  JiraProject, 
  JiraTicket, 
  OAuthState
} from "./types";
import { JIRA_OAUTH_CONFIG, JIRA_API_ENDPOINTS } from "./config";

export class JiraService {
  
  // Get Firestore instance (only when needed)
  private static getDb() {
    return getFirestore();
  }
  
  // Generate OAuth state and PKCE challenge
  static generateOAuthState(conversationId?: string): OAuthState {
    const state = randomBytes(32).toString('hex');
    const codeVerifier = randomBytes(32).toString('base64url');
    
    // Generate SHA256 hash of codeVerifier for PKCE challenge
    const crypto = require('crypto');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return {
      state,
      codeVerifier,
      codeChallenge,
      conversationId,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  // Store OAuth state in Firestore
  static async storeOAuthState(userId: string, oauthState: OAuthState): Promise<void> {
    const db = this.getDb();
    
    // Store in user's collection
    await db.collection("users").doc(userId).collection("oauth-state").doc("jira").set({
      ...oauthState,
      userId,
      timestamp: FieldValue.serverTimestamp(),
      expiresAt: oauthState.expiresAt, // Use the actual expiration time, not server timestamp
    });
    
    // Also store in a global oauth-states collection for easy lookup
    await db.collection("oauth-states").doc(oauthState.state).set({
      ...oauthState,
      userId,
      timestamp: FieldValue.serverTimestamp(),
      expiresAt: oauthState.expiresAt, // Use the actual expiration time, not server timestamp
    });
  }

  // Get OAuth state from Firestore
  static async getOAuthState(state: string): Promise<{ userId: string; oauthState: OAuthState } | null> {
    const db = this.getDb();
    
    try {
      // Get state from the global oauth-states collection
      const oauthStateDoc = await db.collection("oauth-states").doc(state).get();
      
      if (!oauthStateDoc.exists) {
        return null;
      }
      
      const oauthStateData = oauthStateDoc.data();
      if (!oauthStateData) {
        return null;
      }
      
      const oauthState: OAuthState = {
        state: oauthStateData.state,
        codeVerifier: oauthStateData.codeVerifier,
        codeChallenge: oauthStateData.codeChallenge,
        conversationId: oauthStateData.conversationId,
        timestamp: oauthStateData.timestamp?.toDate() || new Date(),
        expiresAt: oauthStateData.expiresAt?.toDate() || new Date(),
      };
      
      return { 
        userId: oauthStateData.userId, 
        oauthState 
      };
    } catch (error) {
      console.error('Error getting OAuth state:', error);
      return null;
    }
  }

  // Clean up OAuth state
  static async cleanupOAuthState(userId: string): Promise<void> {
    const db = this.getDb();
    
    try {
      // Clean up user's oauth-state
      await db.collection("users").doc(userId).collection("oauth-state").doc("jira").delete();
      
      // Clean up global oauth-states collection
      // We need to find the state document for this user
      const userOAuthDoc = await db.collection("users").doc(userId).collection("oauth-state").doc("jira").get();
      if (userOAuthDoc.exists) {
        const userOAuthData = userOAuthDoc.data();
        if (userOAuthData?.state) {
          await db.collection("oauth-states").doc(userOAuthData.state).delete();
        }
      }
    } catch (error) {
      console.error('Error cleaning up OAuth state:', error);
    }
  }

  // Exchange authorization code for tokens
  static async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<any> {
    // Import secrets dynamically to avoid build-time issues
    const { JIRA_CLIENT_ID, JIRA_CLIENT_SECRET } = await import('./config.js');
    
    const response = await fetch(JIRA_OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: JIRA_CLIENT_ID.value(),
        client_secret: JIRA_CLIENT_SECRET.value(),
        code,
        redirect_uri: JIRA_OAUTH_CONFIG.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        code: code.substring(0, 10) + '...',
        codeVerifier: codeVerifier.substring(0, 10) + '...',
        redirectUri: JIRA_OAUTH_CONFIG.redirectUri
      });
      throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  // Get accessible Jira resources (projects)
  static async getAccessibleResources(accessToken: string): Promise<JiraProject[]> {
    const response = await fetch(JIRA_API_ENDPOINTS.accessibleResources, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get accessible resources: ${response.statusText}`);
    }

    const resources = await response.json();
    return resources.map((resource: any) => ({
      cloudId: resource.id,
      name: resource.name,
      url: resource.url,
      avatarUrl: resource.avatarUrl,
      scopes: resource.scopes,
    }));
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string): Promise<any> {
    // Import secrets dynamically to avoid build-time issues
    const { JIRA_CLIENT_ID, JIRA_CLIENT_SECRET } = await import('./config.js');
    
    const response = await fetch(JIRA_OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: JIRA_CLIENT_ID.value(),
        client_secret: JIRA_CLIENT_SECRET.value(),
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Token refresh failed: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  // Save Jira connection to Firestore
  static async saveJiraConnection(
    userId: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresIn: number,
    scope: string,
    availableProjects: JiraProject[]
  ): Promise<void> {
    const db = this.getDb();
    
    // Ensure we have at least one project and set default
    const defaultProject = availableProjects.length > 0 ? availableProjects[0] : undefined;
    
    const connection: JiraConnection = {
      status: 'connected',
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + (expiresIn * 1000)),
      scope,
      availableProjects,
      defaultProject,
      connectedAt: new Date(),
      updatedAt: new Date(),
    };

    // Only include defined fields to avoid Firestore errors
    const connectionData: any = {
      status: connection.status,
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
      expiresAt: connection.expiresAt,
      scope: connection.scope,
      availableProjects: connection.availableProjects,
      connectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Only add defaultProject if it exists
    if (defaultProject) {
      connectionData.defaultProject = defaultProject;
    }

    await db.collection("users").doc(userId).collection("platform-connections").doc("jira").set(connectionData);
  }

  // Get Jira connection from Firestore
  static async getJiraConnection(userId: string): Promise<JiraConnection | null> {
    const db = this.getDb();
    const doc = await db.collection("users").doc(userId).collection("platform-connections").doc("jira").get();
    return doc.exists ? doc.data() as JiraConnection : null;
  }

  // Update default project
  static async updateDefaultProject(userId: string, projectName: string): Promise<JiraProject | null> {
    const db = this.getDb();
    const connection = await this.getJiraConnection(userId);
    if (!connection || !connection.availableProjects) return null;

    const selectedProject = connection.availableProjects.find(p => 
      p.name.toLowerCase().includes(projectName.toLowerCase())
    );

    if (!selectedProject) return null;

    await db.collection("users").doc(userId).collection("platform-connections").doc("jira").update({
      defaultProject: selectedProject,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return selectedProject;
  }

  // Create Jira ticket
  static async createJiraTicket(userId: string, ticketData: Omit<JiraTicket, 'timestamp' | 'status'>): Promise<string> {
    const db = this.getDb();
    const connection = await this.getJiraConnection(userId);
    if (!connection || connection.status !== 'connected') {
      throw new Error('Jira not connected');
    }

    const selectedProject = connection.defaultProject || connection.availableProjects?.[0];
    if (!selectedProject) {
      throw new Error('No Jira project selected');
    }

    // Check if token is expired and refresh if needed
    if (connection.expiresAt && new Date(connection.expiresAt) < new Date()) {
      if (!connection.refreshToken) {
        throw new Error('Access token expired and no refresh token available');
      }

      const refreshData = await this.refreshAccessToken(connection.refreshToken);
      await this.saveJiraConnection(
        userId,
        refreshData.access_token,
        refreshData.refresh_token || connection.refreshToken,
        refreshData.expires_in,
        connection.scope || '',
        connection.availableProjects || []
      );
    }

    // In production, this would create the actual ticket via Jira API
    // For now, we'll simulate the process
    console.log(`Creating Jira ticket in project ${selectedProject.name} (${selectedProject.cloudId}) for user ${userId}:`, ticketData);

    // Save ticket info to Firestore for tracking
    await db.collection("users").doc(userId).collection("jira-tickets").add({
      ...ticketData,
      project: selectedProject.name,
      projectId: selectedProject.cloudId,
      status: 'created',
      timestamp: FieldValue.serverTimestamp(),
    });

    return selectedProject.name;
  }

  // Get available projects for user
  static async getAvailableProjects(userId: string): Promise<JiraProject[]> {
    const connection = await this.getJiraConnection(userId);
    return connection?.availableProjects || [];
  }
}
