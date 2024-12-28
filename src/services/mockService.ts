import { Session, QueueItem, YouTubeVideoDetails } from '../types';
import { getUUID } from '../utils/uuid';

// Load sessions from localStorage
const loadSessions = (): Map<string, Session> => {
  try {
    const savedSessions = localStorage.getItem('karaoke_sessions');
    if (savedSessions) {
      const sessionsArray = JSON.parse(savedSessions);
      return new Map(sessionsArray);
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
  return new Map();
};

// Load queues from localStorage
const loadQueues = (): Map<string, QueueItem[]> => {
  try {
    const savedQueues = localStorage.getItem('karaoke_queues');
    if (savedQueues) {
      const queuesArray = JSON.parse(savedQueues);
      return new Map(queuesArray);
    }
  } catch (error) {
    console.error('Error loading queues:', error);
  }
  return new Map();
};

// Save sessions to localStorage
const saveSessions = (sessions: Map<string, Session>) => {
  try {
    localStorage.setItem(
      'karaoke_sessions',
      JSON.stringify(Array.from(sessions.entries()))
    );
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
};

// Save queues to localStorage
const saveQueues = (queues: Map<string, QueueItem[]>) => {
  try {
    localStorage.setItem(
      'karaoke_queues',
      JSON.stringify(Array.from(queues.entries()))
    );
  } catch (error) {
    console.error('Error saving queues:', error);
  }
};

// In-memory storage with localStorage backup
const sessions = loadSessions();
const queues = loadQueues();

export const createSession = async (): Promise<Session> => {
  const sessionId = getUUID();
  const timestamp = new Date().toISOString();
  
  const session: Session = {
    id: sessionId,
    createdAt: timestamp,
    active: true,
    currentSong: null,
  };

  sessions.set(sessionId, session);
  queues.set(sessionId, []);
  
  // Save to localStorage
  saveSessions(sessions);
  saveQueues(queues);

  return session;
};

export const getSession = async (sessionId: string): Promise<Session> => {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  return session;
};

export const updateCurrentSong = async (sessionId: string, song: QueueItem | null): Promise<void> => {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  session.currentSong = song;
  sessions.set(sessionId, session);
  saveSessions(sessions);
};

export const addToQueue = async (sessionId: string, item: QueueItem): Promise<void> => {
  const queue = queues.get(sessionId) || [];
  queue.push(item);
  queues.set(sessionId, queue);
  saveQueues(queues);
};

export const removeFromQueue = async (sessionId: string, itemId: string): Promise<void> => {
  const queue = queues.get(sessionId) || [];
  const updatedQueue = queue.filter(item => item.id !== itemId);
  queues.set(sessionId, updatedQueue);
  saveQueues(queues);
};

export const getQueue = async (sessionId: string): Promise<QueueItem[]> => {
  return queues.get(sessionId) || [];
};

export const fetchVideoDetails = async (videoId: string): Promise<YouTubeVideoDetails> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock data
  return {
    videoId,
    title: `Mock Video Title for ${videoId}`,
    thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  };
};