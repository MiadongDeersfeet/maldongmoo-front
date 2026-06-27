import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { buildWebSocketUrl } from '@/utils/websocketUrl.js';

const HOME_ACTIVITY_EVENT_TYPES = new Set(['CHECK_IN_CREATED', 'CHECK_IN_UPDATED']);

/**
 * @param {number[]} roomIds
 * @param {{
 *   enabled?: boolean,
 *   currentMemberId?: number | null,
 *   onRoomActivity?: (roomId: number) => void,
 * }} options
 */
export function useHomeRoomsSocket(roomIds, { enabled = false, currentMemberId, onRoomActivity } = {}) {
  const onRoomActivityRef = useRef(onRoomActivity);
  const currentMemberIdRef = useRef(currentMemberId);
  const roomIdsKey = roomIds.join(',');

  useEffect(() => {
    onRoomActivityRef.current = onRoomActivity;
  }, [onRoomActivity]);

  useEffect(() => {
    currentMemberIdRef.current = currentMemberId ?? null;
  }, [currentMemberId]);

  useEffect(() => {
    if (!enabled || roomIds.length === 0) {
      return undefined;
    }

    /** @type {import('@stomp/stompjs').StompSubscription[]} */
    const subscriptions = [];

    const notifyActivity = (roomId) => {
      if (!roomId) {
        return;
      }
      onRoomActivityRef.current?.(roomId);
    };

    const handleRoomEvent = (roomId, payload) => {
      if (!payload || !HOME_ACTIVITY_EVENT_TYPES.has(payload.type)) {
        return;
      }

      const actorMemberId = Number(payload.memberId);
      if (Number.isFinite(actorMemberId) && actorMemberId === currentMemberIdRef.current) {
        return;
      }

      notifyActivity(roomId);
    };

    const handleChatMessage = (roomId, payload) => {
      const senderMemberId = Number(payload?.memberId);
      if (Number.isFinite(senderMemberId) && senderMemberId === currentMemberIdRef.current) {
        return;
      }

      notifyActivity(roomId);
    };

    const client = new Client({
      webSocketFactory: () => new WebSocket(buildWebSocketUrl()),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        roomIds.forEach((roomId) => {
          subscriptions.push(
            client.subscribe(`/topic/rooms/${roomId}/events`, (frame) => {
              try {
                handleRoomEvent(roomId, JSON.parse(frame.body));
              } catch {
                // ignore malformed payloads
              }
            }),
          );
          subscriptions.push(
            client.subscribe(`/topic/rooms/${roomId}/chat`, (frame) => {
              try {
                handleChatMessage(roomId, JSON.parse(frame.body));
              } catch {
                // ignore malformed payloads
              }
            }),
          );
        });
      },
    });

    client.activate();

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      client.deactivate();
    };
  }, [enabled, roomIds, roomIdsKey]);

  return {};
}
