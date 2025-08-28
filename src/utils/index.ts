// Common utility functions

export const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    return '';
  }
};

export const formatConversationTitle = (title: string, isActive: boolean): string => {
  if (!title || title === "Start a new conversation...") {
    return isActive ? "Start typing..." : "New Conversation";
  }
  
  // Truncate long titles
  if (title.length > 40) {
    return title.substring(0, 37) + "...";
  }
  
  return title;
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
