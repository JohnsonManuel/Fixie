# Fixie Platform

A modern, responsive chat application for Fixie - an AI-powered IT support platform that provides intelligent chat support.

## Features

- **Modern React Components**: Built with React 18 and TypeScript
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Professional Styling**: Clean, modern UI designed for IT support platforms
- **Interactive Elements**: Hover effects, smooth transitions, and engaging animations
- **AI Chat Support**: Intelligent conversation handling with Firebase backend
- **Real-time Updates**: Live chat functionality with Firestore
- **User Authentication**: Secure Firebase authentication system

## Sections Included

1. **Header**: Navigation with logo and user authentication
2. **Chat Interface**: Real-time messaging with AI support
3. **Conversation Management**: Create, manage, and delete chat conversations
4. **Responsive Sidebar**: Mobile-friendly navigation and conversation list
5. **User Dashboard**: Clean, focused chat experience

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Project

1. Start the development server:
   ```bash
   npm start
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

## Project Structure

```
├── src/
│   ├── App.tsx              # Main App component
│   ├── App.css              # Main stylesheet
│   ├── Dashboard.tsx        # Main chat dashboard
│   ├── Dashboard.css        # Dashboard styles
│   ├── Login.tsx            # User authentication
│   ├── Login.css            # Login styles
│   ├── Signup.tsx           # User registration
│   ├── Signup.css           # Signup styles
│   ├── components/
│   │   └── ChatMessage.tsx  # Chat message component
│   ├── hooks/
│   │   └── useAuth.ts       # Authentication hook
│   ├── firebase.ts          # Firebase configuration
│   └── config.ts            # App configuration
├── functions/
│   └── src/
│       ├── index.ts         # Firebase functions entry point
│       └── chat.ts          # Chat function
├── package.json              # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Customization

- **Colors**: Update CSS variables in component CSS files to match your brand
- **Content**: Modify text content in React components
- **Styling**: Adjust CSS classes and properties as needed
- **Firebase**: Configure your own Firebase project settings

## Technologies Used

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe JavaScript
- **Firebase**: Backend services (Authentication, Firestore, Functions)
- **CSS3**: Modern CSS with Grid, Flexbox, and animations
- **Responsive Design**: Mobile-first approach

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is for demonstration purposes. Please ensure you have the right to use any content or design elements.

## Credits

This project showcases a modern AI chat support platform with Firebase backend integration. 