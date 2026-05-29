// hooks/useSocket.js — connects to the Socket.io server and handles live events

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket({ onResolved, onEscalated } = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('/', { withCredentials: true });

    socketRef.current.on('connect', () => {
      console.log('[WS] connected:', socketRef.current.id);
    });

    // FCFS win broadcast — update any open tracker instantly
    if (onResolved) {
      socketRef.current.on('issue:resolved', onResolved);
    }

    // Escalation alert — mentors notified
    if (onEscalated) {
      socketRef.current.on('issue:escalated', onEscalated);
    }

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const joinMentors = useCallback(() => {
    socketRef.current?.emit('join:mentors');
  }, []);

  return { socket: socketRef.current, joinMentors };
}
