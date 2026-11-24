import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "../../../lib/socket";
import { useAuth } from "../../context/AuthContext";

const STORAGE_PREFIX = "hexachat-assistant:";
const MAX_STORED = 40;
const WAIT_FOR_FIRST_WORD_MS = 30_000;

function load(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(key, messages) {
  try {
    localStorage.setItem(key, JSON.stringify(messages.slice(-MAX_STORED)));
  } catch {
    /* storage full or unavailable */
  }
}

export default function useAssistant() {
  const { user } = useAuth();
  const storageKey = `${STORAGE_PREFIX}${user?._id || user?.id || "guest"}`;

  const [messages, setMessages] = useState(() => load(storageKey));
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");

  const messagesRef = useRef(messages);
  const requestIdRef = useRef(null);
  const watchdogRef = useRef(null);

  // Keep the ref current, and save once an answer is finished.
  useEffect(() => {
    messagesRef.current = messages;
    if (!isStreaming) save(storageKey, messages);
  }, [messages, isStreaming, storageKey]);

  const endRequest = useCallback((errorMessage) => {
    clearTimeout(watchdogRef.current);
    requestIdRef.current = null;
    setIsStreaming(false);

    if (errorMessage) {
      setError(errorMessage);
      // remove the empty "typing" placeholder
      setMessages((previous) => {
        const last = previous[previous.length - 1];
        return last?.role === "assistant" && !last.content
          ? previous.slice(0, -1)
          : previous;
      });
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onChunk = ({ requestId, text }) => {
      if (requestId !== requestIdRef.current) return;
      clearTimeout(watchdogRef.current);

      setMessages((previous) => {
        const next = [...previous];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          next[next.length - 1] = { ...last, content: last.content + text };
        }
        return next;
      });
    };

    const onDone = ({ requestId }) => {
      if (requestId === requestIdRef.current) endRequest();
    };

    const onError = ({ requestId, message }) => {
      if (requestId === requestIdRef.current) {
        endRequest(message || "The assistant is unavailable right now.");
      }
    };

    socket.on("assistant:chunk", onChunk);
    socket.on("assistant:done", onDone);
    socket.on("assistant:error", onError);

    return () => {
      socket.off("assistant:chunk", onChunk);
      socket.off("assistant:done", onDone);
      socket.off("assistant:error", onError);
      clearTimeout(watchdogRef.current);
    };
  }, [endRequest]);

  const send = useCallback(
    (text) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      const socket = getSocket();
      if (!socket.connected) socket.connect();

      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      requestIdRef.current = requestId;

      const history = [...messagesRef.current, { role: "user", content }];

      setError("");
      setIsStreaming(true);
      setMessages([...history, { role: "assistant", content: "" }]);

      // If nothing comes back (offline, server asleep), stop waiting.
      watchdogRef.current = setTimeout(
        () => endRequest("No answer received. Please try again."),
        WAIT_FOR_FIRST_WORD_MS
      );

      socket.emit("assistant:ask", { requestId, messages: history });
    },
    [isStreaming, endRequest]
  );

  const stop = useCallback(() => {
    getSocket().emit("assistant:stop");
  }, []);

  const clear = useCallback(() => {
    if (isStreaming) getSocket().emit("assistant:stop");
    endRequest();
    setError("");
    setMessages([]);
  }, [isStreaming, endRequest]);

  return { messages, isStreaming, error, send, stop, clear };
}