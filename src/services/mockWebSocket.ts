import { WebSocketMessage } from '../types';
import { getUUID } from '../utils/uuid';

type MessageHandler = (message: WebSocketMessage) => void;

// Load connections from localStorage
const loadConnections = (): Map<string, Set<string>> => {
  try {
    const savedConnections = localStorage.getItem('karaoke_connections');
    if (savedConnections) {
      const connectionsArray = JSON.parse(savedConnections);
      const connections = new Map<string, Set<string>>();
      connectionsArray.forEach(([sessionId, connectionIds]: [string, string[]]) => {
        connections.set(sessionId, new Set(connectionIds));
      });
      return connections;
    }
  } catch (error) {
    console.error('Error loading connections:', error);
  }
  return new Map();
};

// Save connections to localStorage
const saveConnections = (connections: Map<string, Set<string>>) => {
  try {
    const connectionsArray = Array.from(connections.entries()).map(
      ([sessionId, connectionIds]) => [sessionId, Array.from(connectionIds)]
    );
    localStorage.setItem('karaoke_connections', JSON.stringify(connectionsArray));
  } catch (error) {
    console.error('Error saving connections:', error);
  }
};

class MockWebSocketService {
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private connections: Map<string, Set<string>> = loadConnections();
  private connected: boolean = false;
  private currentSessionId: string | null = null;
  private currentConnectionId: string | null = null;

  connect(sessionId: string) {
    console.log('Mock WebSocket connected for session:', sessionId);
    this.connected = true;
    this.currentSessionId = sessionId;
    this.currentConnectionId = getUUID();

    // Initialize handlers set for this session if it doesn't exist
    if (!this.handlers.has(sessionId)) {
      this.handlers.set(sessionId, new Set());
    }

    // Add connection to the session
    if (!this.connections.has(sessionId)) {
      this.connections.set(sessionId, new Set());
    }
    this.connections.get(sessionId)?.add(this.currentConnectionId);
    saveConnections(this.connections);

    // Broadcast join message
    this.broadcastToSession(sessionId, {
      action: 'JOIN_SESSION',
      payload: { connectionId: this.currentConnectionId },
    });
  }

  disconnect() {
    console.log('Mock WebSocket disconnected');
    if (this.currentSessionId && this.currentConnectionId) {
      // Remove connection from the session
      const sessionConnections = this.connections.get(this.currentSessionId);
      if (sessionConnections) {
        sessionConnections.delete(this.currentConnectionId);
        if (sessionConnections.size === 0) {
          this.connections.delete(this.currentSessionId);
        }
        saveConnections(this.connections);
      }
    }

    this.connected = false;
    this.currentSessionId = null;
    this.currentConnectionId = null;
    this.handlers.clear();
  }

  addMessageHandler(sessionId: string, handler: MessageHandler) {
    const sessionHandlers = this.handlers.get(sessionId) || new Set();
    sessionHandlers.add(handler);
    this.handlers.set(sessionId, sessionHandlers);
  }

  removeMessageHandler(sessionId: string, handler: MessageHandler) {
    const sessionHandlers = this.handlers.get(sessionId);
    if (sessionHandlers) {
      sessionHandlers.delete(handler);
      if (sessionHandlers.size === 0) {
        this.handlers.delete(sessionId);
      }
    }
  }

  private broadcastToSession(sessionId: string, message: WebSocketMessage) {
    const sessionHandlers = this.handlers.get(sessionId);
    if (sessionHandlers) {
      sessionHandlers.forEach(handler => {
        // Add small delay to simulate network latency
        setTimeout(() => handler(message), 100);
      });
    }
  }

  sendMessage(message: WebSocketMessage) {
    if (!this.currentSessionId) return;
    
    console.log('Mock WebSocket message sent:', message);
    this.broadcastToSession(this.currentSessionId, message);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Export a singleton instance
export const mockWebSocketService = new MockWebSocketService();