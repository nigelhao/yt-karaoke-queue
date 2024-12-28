import { useEffect, useRef, useState, useCallback } from 'react';
import YouTube from 'youtube-player';
import { useQueue } from '../contexts/QueueContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { PlayerState } from '../types';

export const useYouTubePlayer = () => {
  const playerRef = useRef<any>(null);
  const { state, dispatch } = useQueue();
  const [playerState, setPlayerState] = useState<PlayerState>({
    isReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

  const { sendMessage } = useWebSocket(state.session?.id || '');

  const initializePlayer = useCallback((elementId: string) => {
    if (!playerRef.current) {
      playerRef.current = YouTube(elementId, {
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          iv_load_policy: 3, // Hide video annotations
          fs: 1, // Show fullscreen button
          playsinline: 1, // Play inline on mobile
        },
      });

      // Handle player ready
      playerRef.current.on('ready', () => {
        setPlayerState(prev => ({ ...prev, isReady: true }));
      });

      // Handle state changes
      playerRef.current.on('stateChange', (event: { data: number }) => {
        const isPlaying = event.data === 1;
        setPlayerState(prev => ({ ...prev, isPlaying }));

        // Video ended
        if (event.data === 0 && state.queue.length > 0) {
          const nextSong = state.queue[0];
          if (nextSong) {
            // Send message through WebSocket to update all clients
            sendMessage({
              action: 'UPDATE_CURRENT_SONG',
              payload: nextSong,
            });

            // Update local state
            dispatch({ type: 'UPDATE_CURRENT_SONG', payload: nextSong });
          }
        }
      });

      // Track current time and duration
      const timeUpdateInterval = setInterval(async () => {
        if (playerRef.current) {
          try {
            const [currentTime, duration] = await Promise.all([
              playerRef.current.getCurrentTime(),
              playerRef.current.getDuration(),
            ]);
            setPlayerState(prev => ({ ...prev, currentTime, duration }));
          } catch (error) {
            console.error('Error updating player time:', error);
          }
        }
      }, 1000);

      return () => clearInterval(timeUpdateInterval);
    }
  }, [dispatch, state.queue, sendMessage]);

  // Load video when current song changes
  useEffect(() => {
    if (playerState.isReady && state.session?.currentSong) {
      playerRef.current.loadVideoById(state.session.currentSong.videoId);
    }
  }, [playerState.isReady, state.session?.currentSong]);

  const play = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (playerRef.current) {
      playerRef.current.setVolume(Math.max(0, Math.min(100, volume)));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return {
    playerState,
    initializePlayer,
    play,
    pause,
    seekTo,
    setVolume,
  };
};