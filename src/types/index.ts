// Session Types
export interface Session {
  id: string;
  createdAt: string;
  active: boolean;
  currentSong: QueueItem | null;
}

// Queue Types
export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  addedBy: string;
  addedAt: string;
  played: boolean;
}

// YouTube Types
export interface YouTubeVideoDetails {
  videoId: string;
  title: string;
  thumbnail: string;
}

// WebSocket Types
export type WebSocketAction = 
  | 'ADD_TO_QUEUE'
  | 'REMOVE_FROM_QUEUE'
  | 'UPDATE_CURRENT_SONG'
  | 'JOIN_SESSION'
  | 'LEAVE_SESSION';

export interface WebSocketMessage {
  action: WebSocketAction;
  payload: any;
}

// Player Types
export interface PlayerState {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

// Context Types
export interface QueueState {
  session: Session | null;
  queue: QueueItem[];
  isConnected: boolean;
}

export type QueueAction =
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_QUEUE'; payload: QueueItem[] }
  | { type: 'ADD_TO_QUEUE'; payload: QueueItem }
  | { type: 'REMOVE_FROM_QUEUE'; payload: string }
  | { type: 'UPDATE_CURRENT_SONG'; payload: QueueItem }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean };

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Environment Types
export interface Environment {
  MODE: 'development' | 'production';
  VITE_AWS_REGION: string;
  VITE_AWS_ACCESS_KEY_ID: string;
  VITE_AWS_SECRET_ACCESS_KEY: string;
  VITE_API_ENDPOINT: string;
  VITE_WEBSOCKET_URL: string;
}

// Error Types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}