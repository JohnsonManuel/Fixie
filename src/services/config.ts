// Configuration file for API keys and environment variables
export const config = {
  // OpenAI API Configuration
  openaiApiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
  
  // Firebase Configuration
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyA1U9nJgk2IlYYL-TLazmrcvxcwGvrVG4s',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'jj-ai-platform.firebaseapp.com',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'jj-ai-platform',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'jj-ai-platform.firebasestorage.app',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '308405783967',
    appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:308405783967:web:40a3fbdb903262092dc1aa',
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-P3PFKHR81H'
  },

  // Firebase Functions endpoints
  functions: {
    chat: process.env.REACT_APP_CHAT_ENDPOINT || 'https://chat-proxy-308405783967.europe-west1.run.app'
  }
}; 