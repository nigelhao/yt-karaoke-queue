import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueue } from '../contexts/QueueContext';
import { createSession, getSession } from '../services/aws';
import { Session } from '../types';

// Load active session from localStorage
const loadActiveSession = (): string | null => {
  try {
    return localStorage.getItem('karaoke_active_session');
  } catch (error) {
    console.error('Error loading active session:', error);
    return null;
  }
};

// Save active session to localStorage
const saveActiveSession = (sessionId: string | null) => {
  try {
    if (sessionId) {
      localStorage.setItem('karaoke_active_session', sessionId);
    } else {
      localStorage.removeItem('karaoke_active_session');
    }
  } catch (error) {
    console.error('Error saving active session:', error);
  }
};

export const useSession = (sessionId?: string) => {
  const { dispatch } = useQueue();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initializeSession = async () => {
      try {
        let session: Session;
        const activeSessionId = loadActiveSession();

        if (sessionId) {
          try {
            // Try to join existing session
            session = await getSession(sessionId);
            if (!session.active) {
              throw new Error('Session is no longer active');
            }
            // Save as active session if we're on the host view
            if (location.pathname.startsWith('/host/')) {
              saveActiveSession(sessionId);
            }
          } catch (err) {
            console.error('Session error:', err);
            if (location.pathname.startsWith('/join/')) {
              // For mobile view, show error message
              throw new Error('Invalid or expired session. Please scan a new QR code.');
            } else {
              // For host view, redirect to home
              saveActiveSession(null);
              navigate('/');
              return;
            }
          }
        } else if (activeSessionId && location.pathname === '/') {
          // Try to restore active session
          try {
            session = await getSession(activeSessionId);
            if (session.active) {
              navigate(`/host/${session.id}`);
              return;
            }
          } catch (err) {
            console.error('Failed to restore session:', err);
            saveActiveSession(null);
          }
          // Create new session if restore failed
          session = await createSession();
          navigate(`/host/${session.id}`);
          return;
        } else {
          // Create new session
          session = await createSession();
          if (location.pathname === '/') {
            navigate(`/host/${session.id}`);
            return;
          }
        }

        dispatch({ type: 'SET_SESSION', payload: session });
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
        setError(errorMessage);
        console.error('Session initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [sessionId, dispatch, navigate, location.pathname]);

  // Clear session when component unmounts
  useEffect(() => {
    return () => {
      if (location.pathname === '/') {
        dispatch({ type: 'SET_SESSION', payload: null });
      }
    };
  }, [dispatch, location.pathname]);

  return {
    loading,
    error,
  };
};