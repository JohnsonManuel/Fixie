# Jira Integration Module

This module provides a clean, organized way to integrate Jira with your Firebase Functions application.

## Structure

```
jira/
├── types.ts          # TypeScript interfaces and types
├── config.ts         # Configuration constants and secrets
├── service.ts        # Business logic and data operations
├── handlers.ts       # Tool call handlers for AI integration
├── oauth.ts          # OAuth endpoints for authentication
├── index.ts          # Module exports
├── package.json      # Module dependencies
└── README.md         # This file
```

## Features

- **Clean Architecture**: Separated concerns with clear responsibilities
- **Type Safety**: Full TypeScript support with proper interfaces
- **OAuth Flow**: Secure authentication with PKCE
- **Multi-Project Support**: Handle users with access to multiple Jira projects
- **Token Management**: Automatic refresh of expired tokens
- **AI Integration**: Seamless integration with OpenAI tool calling

## How It Works

### 1. OAuth Flow
1. User clicks "Connect to Jira" in chat
2. Opens OAuth window to Atlassian
3. User authorizes the application
4. Callback stores tokens and project information
5. Window closes and user returns to chat

### 2. Project Selection
- Users with multiple projects see a dropdown
- First project becomes default
- Users can change default project anytime
- AI creates tickets in the selected project

### 3. Ticket Creation
- AI checks Jira connection status
- If connected, shows ticket confirmation
- Creates ticket in the selected project
- Stores ticket information in Firestore

## Usage

### Backend
```typescript
import { JiraService } from './jira/service';
import { handleCreateJiraTicket } from './jira/handlers';

// Check connection
const connection = await JiraService.getJiraConnection(userId);

// Create ticket
const projectName = await JiraService.createJiraTicket(userId, ticketData);
```

### Frontend
```typescript
// Connect to Jira
const oauthUrl = `https://your-region-your-project.cloudfunctions.net/jiraOAuthStart?idToken=${idToken}`;
window.open(oauthUrl, 'jira_oauth', 'width=600,height=700');

// Listen for completion
window.addEventListener('message', (event) => {
  if (event.data.type === 'jira_connected') {
    // Handle successful connection
  }
});
```

## Configuration

Set these Firebase secrets:
```bash
firebase functions:secrets:set JIRA_CLIENT_ID
firebase functions:secrets:set JIRA_CLIENT_SECRET
```

## Deployment

Deploy all functions:
```bash
cd functions
npm run deploy
```

## Security Features

- **PKCE**: Proof Key for Code Exchange for OAuth security
- **State Validation**: CSRF protection with state parameter
- **Token Encryption**: Secure storage of access tokens
- **Automatic Cleanup**: OAuth state cleanup after use
- **Scope Limitation**: Minimal required permissions

## Error Handling

- Graceful fallbacks for OAuth failures
- User-friendly error messages
- Automatic token refresh
- Connection status monitoring
