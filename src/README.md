# Frontend Application Structure

This document describes the organized folder structure for the Fixie chat application.

## 📁 Folder Organization

### `/src/pages/`
Contains all page-level components that represent full pages in the application.
- `Dashboard.tsx` - Main chat interface
- `Login.tsx` - User authentication page
- `Signup.tsx` - User registration page
- `index.ts` - Exports all page components

### `/src/components/`
Reusable UI components organized by feature.
- `/chat/` - Chat-related components
  - `ChatMessage.tsx` - Individual chat message component
- `index.ts` - Exports all components

### `/src/layouts/`
Layout components that wrap pages (currently empty, ready for future use).

### `/src/services/`
External service integrations and configuration.
- `config.ts` - Application configuration and endpoints
- `firebase.ts` - Firebase configuration and initialization
- `index.ts` - Exports all services

### `/src/hooks/`
Custom React hooks for shared logic.
- `useAuth.ts` - Authentication state management

### `/src/types/`
TypeScript type definitions and interfaces.
- `index.ts` - All application types and interfaces

### `/src/utils/`
Utility functions and helpers.
- `index.ts` - Common utility functions

### `/src/styles/`
CSS stylesheets organized by component.
- `App.css` - Main application styles
- `Dashboard.css` - Dashboard-specific styles
- `Login.css` - Login page styles
- `Signup.css` - Signup page styles
- `index.css` - Global styles

## 🔄 Import Patterns

### Page Components
```typescript
import { Dashboard, Login, Signup } from '../pages';
```

### Components
```typescript
import { ChatMessage } from '../components';
```

### Services
```typescript
import { config, db, auth } from '../services';
```

### Types
```typescript
import { Message, Conversation, AuthError } from '../types';
```

### Utils
```typescript
import { formatTimestamp, formatConversationTitle } from '../utils';
```

## 🎯 Benefits of This Structure

1. **Clear Separation**: Each folder has a specific purpose
2. **Easy Navigation**: Developers can quickly find what they need
3. **Scalable**: Easy to add new features without cluttering
4. **Maintainable**: Related code is grouped together
5. **Import Efficiency**: Index files provide clean import paths
6. **Type Safety**: Centralized types prevent duplication

## 🚀 Adding New Features

### New Page
1. Create component in `/src/pages/`
2. Add export to `/src/pages/index.ts`
3. Update routing in `App.tsx`

### New Component
1. Create component in appropriate subfolder
2. Add export to `/src/components/index.ts`
3. Import where needed

### New Service
1. Create service file in `/src/services/`
2. Add export to `/src/services/index.ts`
3. Import where needed

### New Type
1. Add interface/type to `/src/types/index.ts`
2. Import where needed

This structure follows React best practices and makes the codebase easy to understand and maintain.
