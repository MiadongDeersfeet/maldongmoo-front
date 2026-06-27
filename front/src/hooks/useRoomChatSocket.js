import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { buildWebSocketUrl } from '@/utils/websocketUrl.js';

/**
 * @param {number | null | undefined} roomId
 * @param {{
 *   enabled?: boolean,
 *   onMessage?: (message: Record<string, unknown>) => void,
 *   onReaction?: (payload: Record<string, unknown>) => void,
 * }} options
 */
export function useRoomChatSocket(roomId, { enabled = false, onMessage, onReaction } = {}) {
  const clientRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const onReactionRef = useRef(onReaction);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const isActive = Boolean(enabled && roomId);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onReactionRef.current = onReaction;
  }, [onReaction]);

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
        client.subscribe(`/topic/rooms/${roomId}/chat`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            onMessageRef.current?.(payload);
          } catch {
            // ignore malformed payloads
          }
        });
        client.subscribe(`/topic/rooms/${roomId}/chat-reactions`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            onReactionRef.current?.(payload);
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

  const sendChatMessage = useCallback(
    (messageText) => {
      const client = clientRef.current;
      if (!client?.connected || !roomId) {
        return false;
      }

      client.publish({
        destination: `/app/rooms/${roomId}/chat`,
        body: JSON.stringify({ messageText }),
      });
      return true;
    },
    [roomId],
  );

  return {
    isConnected: isActive && isConnected,
    connectionError: isActive ? connectionError : null,
    sendChatMessage,
  };
}
