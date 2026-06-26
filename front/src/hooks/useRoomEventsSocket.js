import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { buildWebSocketUrl } from '@/utils/websocketUrl.js';

/**
 * @param {number | null | undefined} roomId
 * @param {{
 *   enabled?: boolean,
 *   onRoomEvent?: (event: Record<string, unknown>) => void,
 * }} options
 */
export function useRoomEventsSocket(roomId, { enabled = false, onRoomEvent } = {}) {
  const clientRef = useRef(null);
  const onRoomEventRef = useRef(onRoomEvent);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const isActive = Boolean(enabled && roomId);

  useEffect(() => {
    onRoomEventRef.current = onRoomEvent;
  }, [onRoomEvent]);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const client = new Client({
      webSocketFactory: () => new WebSocket(buildWebSocketUrl()),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        setConnectionError(null);
        client.subscribe(`/topic/rooms/${roomId}/events`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            onRoomEventRef.current?.(payload);
          } catch {
            // ignore malformed payloads
          }
        });
      },
      onStompError: (frame) => {
        setConnectionError(frame.headers.message || 'STOMP connection failed');
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      },
      onWebSocketError: () => {
        setConnectionError('WebSocket connection failed');
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [isActive, roomId]);

  return {
    isConnected: isActive && isConnected,
    connectionError: isActive ? connectionError : null,
  };
}
