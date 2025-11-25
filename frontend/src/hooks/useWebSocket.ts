import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Protocols = string | string[] | undefined;

interface UseWebSocketOptions {
  enabled?: boolean;
  protocols?: Protocols;
  reconnect?: boolean;
  reconnectInterval?: number;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
}

interface UseWebSocketResult {
  readyState: WebSocket['readyState'];
  lastMessage: MessageEvent | null;
  sendMessage: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => boolean;
  sendJsonMessage: (data: unknown) => boolean;
  close: () => void;
}

const DEFAULT_RECONNECT_INTERVAL = 5_000;

const serializeProtocols = (protocols: Protocols): string =>
  Array.isArray(protocols) ? protocols.sort().join('|') : protocols ?? '';

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}): UseWebSocketResult => {
  const {
    enabled = true,
    protocols,
    reconnect = true,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    onMessage,
    onError,
  } = options;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const [readyState, setReadyState] = useState<WebSocket['readyState']>(WebSocket.CLOSED);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const protocolKey = useMemo(() => serializeProtocols(protocols), [protocols]);

  const clearReconnectTimer = useCallback(() => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
  }, []);

  const cleanupSocket = useCallback(
    (shouldClose = true) => {
      clearReconnectTimer();
      if (!socketRef.current) {
        return;
      }

      const socket = socketRef.current;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (shouldClose && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }

      socketRef.current = null;
      setReadyState(WebSocket.CLOSED);
    },
    [clearReconnectTimer],
  );

  useEffect(() => {
    if (!enabled) {
      cleanupSocket();
      return;
    }

    let isMounted = true;

    const openSocket = () => {
      cleanupSocket(false);
      const ws = new WebSocket(url, protocols);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setReadyState(ws.readyState);
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        setLastMessage(event);
        onMessage?.(event);
      };

      ws.onerror = (event) => {
        onError?.(event);
      };

      ws.onclose = () => {
        if (!isMounted) {
          return;
        }
        setReadyState(WebSocket.CLOSED);
        socketRef.current = null;

        if (reconnect && enabled) {
          clearReconnectTimer();
          reconnectTimer.current = setTimeout(openSocket, reconnectInterval);
        }
      };
    };

    openSocket();

    return () => {
      isMounted = false;
      cleanupSocket();
    };
  }, [
    url,
    enabled,
    protocols,
    reconnect,
    reconnectInterval,
    onMessage,
    onError,
    cleanupSocket,
    clearReconnectTimer,
    protocolKey,
  ]);

  const sendMessage = useCallback(
    (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return false;
      }
      socket.send(data);
      return true;
    },
    [],
  );

  const sendJsonMessage = useCallback(
    (data: unknown) => sendMessage(JSON.stringify(data)),
    [sendMessage],
  );

  const close = useCallback(() => cleanupSocket(), [cleanupSocket]);

  return {
    readyState,
    lastMessage,
    sendMessage,
    sendJsonMessage,
    close,
  };
};

