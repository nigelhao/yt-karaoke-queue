import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: Map<string, Set<(message: WebSocketMessage) => void>> = new Map();
  private currentSessionId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second

  connect(sessionId: string) {
    if (this.socket) {
      return;
    }

    this.currentSessionId = sessionId;

    // Initialize WebSocket connection
    this.socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
      query: { sessionId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000, // Max 5 seconds between attempts
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 5000);
    });

    // Message handler
    this.socket.on('message', (message: WebSocketMessage) => {
      const sessionHandlers = this.messageHandlers.get(sessionId);
      if (sessionHandlers) {
        sessionHandlers.forEach((handler) => handler(message));
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentSessionId = null;
      this.messageHandlers.clear();
    }
  }

  addMessageHandler(sessionId: string, handler: (message: WebSocketMessage) => void) {
    if (!this.messageHandlers.has(sessionId)) {
      this.messageHandlers.set(sessionId, new Set());
    }
    this.messageHandlers.get(sessionId)?.add(handler);
  }

  removeMessageHandler(sessionId: string, handler: (message: WebSocketMessage) => void) {
    const sessionHandlers = this.messageHandlers.get(sessionId);
    if (sessionHandlers) {
      sessionHandlers.delete(handler);
      if (sessionHandlers.size === 0) {
        this.messageHandlers.delete(sessionId);
      }
    }
  }

  sendMessage(message: WebSocketMessage) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message', message);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
      // Queue message to be sent when connection is restored
      this.socket?.once('connect', () => {
        this.socket?.emit('message', message);
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSessionId(): string | null {
    return this.currentSessionId;
  }
}

// Export a singleton instance
export const webSocketService = new WebSocketService();