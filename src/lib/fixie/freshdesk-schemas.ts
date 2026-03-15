export const FRESHDESK_SCHEMAS = [
  {
    name: 'create_ticket',
    description: 'Create a new support ticket in Freshdesk',
    input_schema: {
      type: 'object',
      properties: {
        subject:     { type: 'string', description: 'Ticket subject line' },
        description: { type: 'string', description: 'Detailed description of the issue' },
        email:       { type: 'string', description: 'Requester email address' },
        priority:    { type: 'integer', enum: [1,2,3,4], description: '1=Low, 2=Medium, 3=High, 4=Urgent' },
        status:      { type: 'integer', enum: [2,3,4,5], description: '2=Open, 3=Pending, 4=Resolved, 5=Closed' },
        tags:        { type: 'array', items: { type: 'string' }, description: 'Tags to apply' },
      },
      required: ['subject', 'description', 'email'],
    },
  },
  {
    name: 'get_ticket',
    description: 'Retrieve a specific Freshdesk ticket by ID',
    input_schema: {
      type: 'object',
      properties: { ticket_id: { type: 'integer', description: 'Freshdesk ticket ID' } },
      required: ['ticket_id'],
    },
  },
  {
    name: 'list_tickets',
    description: 'List Freshdesk tickets with optional filters',
    input_schema: {
      type: 'object',
      properties: {
        filter:     { type: 'string', enum: ['new_and_my_open','watching','spam','deleted'] },
        order_by:   { type: 'string', enum: ['created_at','due_by','updated_at','status'] },
        order_type: { type: 'string', enum: ['asc','desc'] },
        per_page:   { type: 'integer', default: 30 },
      },
      required: [],
    },
  },
  {
    name: 'update_ticket',
    description: "Update an existing Freshdesk ticket's status, priority, or content",
    input_schema: {
      type: 'object',
      properties: {
        ticket_id:   { type: 'integer' },
        status:      { type: 'integer', enum: [2,3,4,5] },
        priority:    { type: 'integer', enum: [1,2,3,4] },
        subject:     { type: 'string' },
        description: { type: 'string' },
      },
      required: ['ticket_id'],
    },
  },
  {
    name: 'reply_to_ticket',
    description: 'Add a reply or note to an existing Freshdesk ticket',
    input_schema: {
      type: 'object',
      properties: {
        ticket_id: { type: 'integer' },
        body:      { type: 'string', description: 'Reply content (HTML supported)' },
      },
      required: ['ticket_id', 'body'],
    },
  },
];
