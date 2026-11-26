import { useId } from "react";

// The "AI spark": one big four-point star and a small one, in a blue-to-pink
// gradient. It is the look people recognise as an AI assistant.
// It keeps its own colours on purpose, in every theme.
export default function AssistantIcon({ size = 22 }) {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Big spark */}
      <path
        d="M10 2.5c.5 4.6 2.9 7 7.5 7.5-4.6.5-7 2.9-7.5 7.5-.5-4.6-2.9-7-7.5-7.5C7.1 9.5 9.5 7.1 10 2.5z"
        fill={`url(#${gradientId})`}
      />
      {/* Small spark */}
      <path
        d="M18.5 14c.25 2.3 1.2 3.25 3.5 3.5-2.3.25-3.25 1.2-3.5 3.5-.25-2.3-1.2-3.25-3.5-3.5 2.3-.25 3.25-1.2 3.5-3.5z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}