import { useEffect, useState } from "react";

import api from "../../../lib/api";

// Asks the server whether `value` is still free, half a second after the user
// stops typing. `field` is "username", "email" or "phone".
// `enabled` should be false while the value is empty or has a format error.
export default function useFieldAvailability(field, value, enabled) {
  const [result, setResult] = useState({ value: "", taken: "", available: false });

  const trimmed = value.trim();
  const active = enabled && trimmed.length > 0;

  useEffect(() => {
    if (!active) return undefined;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/auth/check-availability", {
          params: { field, value: trimmed },
          signal: controller.signal,
        });

        setResult({
          value: trimmed,
          taken: data.available ? "" : data.message,
          available: Boolean(data.available),
        });
      } catch {
        if (controller.signal.aborted) return;

        // Network problem or rate limit: don't block the user.
        // The server checks everything again when the form is submitted.
        setResult({ value: trimmed, taken: "", available: false });
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [field, trimmed, active]);

  const isCurrent = active && result.value === trimmed;

  return {
    checking: active && !isCurrent,
    taken: isCurrent ? result.taken : "",
    available: isCurrent && result.available,
  };
}