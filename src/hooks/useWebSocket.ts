import { useEffect, useCallback } from 'react';
import { useQueue } from '../contexts/QueueContext';
import { webSocketService } from '../services/websocket';
import { WebSocketMessage } from '../types';

export const useWebSocket = (sessionId: string) => {
  const { dispatch } = useQueue();

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.action) {
        case 'ADD_TO_QUEUE':
          dispatch({
            type: 'ADD_TO_QUEUE',
            payload: message.payload,
          });
          break;
        case 'REMOVE_FROM_QUEUE':
          dispatch({
            type: 'REMOVE_FROM_QUEUE',
            payload: message.payload,
          });
          break;
        case 'UPDATE_CURRENT_SONG':
          dispatch({
            type: 'UPDATE_CURRENT_SONG',
            payload: message.payload,
          });
          break;
        case 'JOIN_SESSION':
          // Handle new user joining
          console.log('New user joined:', message.payload);
          break;
        default:
          console.warn('Unknown message action:', message.action);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (!sessionId) return;

    // Connect to WebSocket
    webSocketService.connect(sessionId);

    // Add message handler
    webSocketService.addMessageHandler(sessionId, handleMessage);

    // Update connection status
    dispatch({
      type: 'SET_CONNECTION_STATUS',
      payload: webSocketService.isConnected(),
    });

    // Cleanup on unmount
    return () => {
      webSocketService.removeMessageHandler(sessionId, handleMessage);
      webSocketService.disconnect();
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: false,
      });
    };
  }, [sessionId, handleMessage, dispatch]);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      webSocketService.sendMessage(message);
    },
    []
  );

  return {
    sendMessage,
    isConnected: webSocketService.isConnected(),
  };
};