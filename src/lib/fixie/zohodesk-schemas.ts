export const ZOHODESK_SCHEMAS = [
  {
    name: 'create_ticket',
    description: 'Create a new support ticket in Zoho Desk',
    input_schema: {
      type: 'object',
      properties: {
        subject:       { type: 'string',  description: 'Ticket subject' },
        description:   { type: 'string',  description: 'Detailed description of the issue' },
        email:         { type: 'string',  description: 'Requester email address' },
        department_id: { type: 'string',  description: 'Zoho Desk department ID (leave blank to use default)' },
        priority:      { type: 'string',  enum: ['Low', 'Medium', 'High', 'Urgent'] },
        status:        { type: 'string',  enum: ['Open', 'Pending', 'On Hold'] },
      },
      required: ['subject', 'description', 'email'],
    },
  },
  {
    name: 'get_ticket',
    description: 'Retrieve a Zoho Desk ticket by ID',
    input_schema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string', description: 'Zoho Desk ticket ID' },
      },
      required: ['ticket_id'],
    },
  },
  {
    name: 'list_tickets',
    description: 'List Zoho Desk tickets with optional filters',
    input_schema: {
      type: 'object',
      properties: {
        status:     { type: 'string',  enum: ['open', 'pending', 'escalated', 'onhold', 'all'] },
        limit:      { type: 'integer', default: 25 },
        sort_by:    { type: 'string',  enum: ['createdTime', 'modifiedTime', 'dueDate'], default: 'createdTime' },
        sort_order: { type: 'string',  enum: ['asc', 'desc'], default: 'desc' },
      },
      required: [],
    },
  },
  {
    name: 'update_ticket',
    description: "Update a Zoho Desk ticket's status, priority, or subject",
    input_schema: {
      type: 'object',
      properties: {
        ticket_id:   { type: 'string' },
        status:      { type: 'string', enum: ['Open', 'Pending', 'On Hold', 'Resolved', 'Closed'] },
        priority:    { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
        subject:     { type: 'string' },
        description: { type: 'string' },
      },
      required: ['ticket_id'],
    },
  },
  {
    name: 'reply_to_ticket',
    description: 'Send a reply to an existing Zoho Desk ticket',
    input_schema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'string' },
        content:   { type: 'string', description: 'Reply content (HTML supported)' },
      },
      required: ['ticket_id', 'content'],
    },
  },
];
