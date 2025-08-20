# Firebase Functions Architecture

This document describes the new separated function architecture for better maintainability and scalability.

## Architecture Overview

The functions have been separated into focused, single-responsibility modules:

```
functions/src/
├── index.ts              # Main entry point - exports all functions
├── chat.ts               # Pure chat functionality
├── jira-operations.ts    # Jira-specific operations
├── tool-orchestrator.ts  # Tool coordination and workflow
├── shared/
│   └── utils.ts          # Common utilities and helpers
├── jira-oauth.ts         # Jira OAuth handling (existing)
├── simple-support.ts     # Support system logic (existing)
└── prompts.ts            # Prompt templates (existing)
```

## Function Responsibilities

### 1. Chat Function (`chat.ts`)
**Purpose**: Pure chat processing and conversation management
**Responsibilities**:
- Process user messages
- Generate AI responses using the support system
- Manage conversation state and history
- Update conversation titles
- Save assistant responses to Firestore

**Endpoint**: `/chat`
**Input**:
```json
{
  "idToken": "user_token",
  "conversationId": "conversation_id",
  "message": "user_message"
}
```

**Output**:
```json
{
  "response": "AI response",
  "supportStage": "analyzing|escalating|resolved",
  "requiresTool": true|false,
  "toolType": "ticket_creation|null",
  "ticketDetails": {...}
}
```

### 2. Jira Operations (`jira-operations.ts`)
**Purpose**: Handle all Jira-related functionality
**Responsibilities**:
- Check Jira connection status
- Get available projects
- Create tickets
- Update tickets
- Select projects for ticket creation

**Endpoint**: `/jiraOperations`
**Input**:
```json
{
  "idToken": "user_token",
  "action": "check_connection|get_projects|create_ticket|update_ticket|select_project",
  "conversationId": "conversation_id",
  "ticketDetails": {...},
  "projectName": "project_name"
}
```

**Actions**:
- `check_connection`: Returns Jira connection status
- `get_projects`: Returns available Jira projects
- `create_ticket`: Creates a new Jira ticket
- `select_project`: Selects a project for ticket creation

### 3. Tool Orchestrator (`tool-orchestrator.ts`)
**Purpose**: Coordinate between chat and tool functions
**Responsibilities**:
- Determine what tools are needed
- Check tool prerequisites (connections, configurations)
- Route tool actions to appropriate functions
- Manage workflow state

**Endpoint**: `/toolOrchestrator`
**Input**:
```json
{
  "idToken": "user_token",
  "action": "escalate_to_ticket|execute_tool|get_available_tools",
  "conversationId": "conversation_id",
  "toolType": "ticket_creation|jira_ticket|slack_notification",
  "toolData": {...}
}
```

## Usage Flow

### Basic Chat Flow
1. User sends message → **Chat Function**
2. Chat function processes message and determines if tool is needed
3. If tool needed, returns `requiresTool: true` with `toolType`

### Tool Execution Flow
1. Frontend calls **Tool Orchestrator** with tool request
2. Orchestrator checks prerequisites and returns next action
3. Frontend calls appropriate **Tool Function** (e.g., Jira Operations)
4. Tool function executes action and updates conversation

### Example: Ticket Creation Flow
```
User: "I need help with a server issue"
↓
Chat Function: Processes message, determines escalation needed
↓
Returns: { requiresTool: true, toolType: "ticket_creation" }
↓
Frontend calls Tool Orchestrator: escalate_to_ticket
↓
Orchestrator checks: Jira connected? Project selected?
↓
If not connected: Returns "connect_jira" action
If no project: Returns "select_project" action  
If ready: Returns "create_ticket" action
↓
Frontend calls Jira Operations: create_ticket
↓
Ticket created, conversation updated
```

## Benefits of This Architecture

### 1. **Single Responsibility**
- Each function has one clear purpose
- Easier to understand and maintain
- Simpler testing and debugging

### 2. **Independent Deployment**
- Deploy chat updates without affecting Jira functionality
- Scale different functions independently
- Different timeout/memory settings per function

### 3. **Better Error Isolation**
- Chat errors don't break tool functionality
- Tool errors don't break chat functionality
- Easier to implement circuit breakers

### 4. **Easier Extension**
- Add new tools without touching chat logic
- Modify tool behavior without affecting chat
- Clear separation of concerns

### 5. **Improved Testing**
- Test each function independently
- Mock dependencies easily
- Clearer test coverage

## Adding New Tools

To add a new tool (e.g., Slack notifications):

1. **Create tool function** (`slack-operations.ts`)
2. **Add to tool orchestrator** (new case in switch statement)
3. **Update shared utilities** if needed
4. **Export from index.ts**

## Migration Notes

- **Existing chat endpoint**: Still works, but now calls separated functions
- **Jira OAuth**: Unchanged, still exported from main index
- **Support system**: Unchanged, still used by chat function
- **Database structure**: Unchanged, same Firestore collections

## Deployment

Deploy all functions together:
```bash
firebase deploy --only functions
```

Or deploy specific functions:
```bash
firebase deploy --only functions:chat
firebase deploy --only functions:jiraOperations
firebase deploy --only functions:toolOrchestrator
```

## Monitoring and Debugging

Each function has its own logs:
```bash
firebase functions:log --only chat
firebase functions:log --only jiraOperations
firebase functions:log --only toolOrchestrator
```
