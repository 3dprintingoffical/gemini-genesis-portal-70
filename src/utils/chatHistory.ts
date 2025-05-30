
import { Message } from '@/pages/Index';

const CHAT_HISTORY_KEY = 'akm_bot_chat_history';
const MAX_STORED_CHATS = 50;

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export const saveChatSession = (messages: Message[]): string => {
  try {
    const existingHistory = getChatHistory();
    
    // Generate a title from the first user message
    const firstUserMessage = messages.find(m => m.type === 'user');
    const title = firstUserMessage 
      ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
      : 'New Chat';

    const sessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: sessionId,
      title,
      messages,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedHistory = [newSession, ...existingHistory].slice(0, MAX_STORED_CHATS);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    return sessionId;
  } catch (error) {
    console.error('Error saving chat session:', error);
    return '';
  }
};

export const getChatHistory = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    return history.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
};

export const loadChatSession = (sessionId: string): Message[] | null => {
  try {
    const history = getChatHistory();
    const session = history.find(s => s.id === sessionId);
    return session ? session.messages : null;
  } catch (error) {
    console.error('Error loading chat session:', error);
    return null;
  }
};

export const deleteChatSession = (sessionId: string): void => {
  try {
    const history = getChatHistory();
    const updatedHistory = history.filter(s => s.id !== sessionId);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error deleting chat session:', error);
  }
};

export const updateChatSession = (sessionId: string, messages: Message[]): void => {
  try {
    const history = getChatHistory();
    const sessionIndex = history.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      history[sessionIndex].messages = messages;
      history[sessionIndex].updatedAt = new Date();
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error updating chat session:', error);
  }
};

export const clearChatHistory = (): void => {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
};
