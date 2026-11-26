import { useEffect, useRef, useState } from "react";
import { ArrowLeft, SendHorizontal, Square, Trash2 } from "lucide-react";
import useAssistant from "./useAssistant";
import AssistantIcon from "./AssistantIcon";
import MobileBottomNav from "../sidebar/MobileBottomNav";

const SUGGESTIONS = [
  "How do chat requests work?",
  "Help me write a polite message",
  "Give me a fun icebreaker",
  "Explain what I can do in a group",
];

/* The full-page assistant (opened from the Assistant link in the navigation rail).
   On a phone it also shows the bottom tabs, because the sidebar is hidden. */
export default function AssistantMain({ onBack }) {
  const [draft, setDraft] = useState("");
  const { messages, isStreaming, error, send, stop, clear } = useAssistant();

  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the newest text in view.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const submit = (event) => {
    event.preventDefault();
    if (!draft.trim() || isStreaming) return;
    send(draft);
    setDraft("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit(event);
    }
  };

  const last = messages[messages.length - 1];
  const showTyping = isStreaming && last?.role === "assistant" && !last.content;

  return (
    <section className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[var(--wa-chat-bg)]">
      <div className="wa-wallpaper" aria-hidden="true" />

      {/* Header */}
      <header className="relative z-10 flex h-[calc(56px+env(safe-area-inset-top))] shrink-0 select-none items-center gap-3 border-b border-[color:var(--wa-chat-header-border)] bg-[var(--wa-chat-header-bg)] pl-2 pr-3 pt-[env(safe-area-inset-top)] sm:h-[65px] sm:px-4 sm:pt-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="grid size-10 place-items-center rounded-full text-[color:var(--wa-header-icon)] hover:bg-[var(--wa-hover)] sm:hidden"
          >
            <ArrowLeft size={22} />
          </button>
        )}

        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--wa-chip-active-bg)]">
          <AssistantIcon size={24} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] leading-tight text-[color:var(--wa-text-primary)]">HexaBot</p>
          <p className="truncate text-[13px] text-[color:var(--wa-text-secondary)]">
            {isStreaming ? "Typing..." : "AI assistant"}
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear conversation"
            title="Clear conversation"
            className="grid size-10 place-items-center rounded-full text-[color:var(--wa-header-icon)] hover:bg-[var(--wa-hover)]"
          >
            <Trash2 size={19} />
          </button>
        )}
      </header>

      {/* Messages */}
      <div
        ref={listRef}
        aria-live="polite"
        className="whatsapp-scrollbar relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4 sm:px-[8%]"
      >
        {messages.length === 0 && (
          <div className="m-auto flex max-w-[360px] flex-col items-center text-center">
            <span className="mb-4 grid size-16 place-items-center rounded-full bg-[var(--wa-chip-active-bg)]">
              <AssistantIcon size={38} />
            </span>
            <p className="text-[20px] font-semibold text-[color:var(--wa-text-primary)]">Hi, I&apos;m HexaBot</p>
            <p className="mt-1 text-[14px] leading-5 text-[color:var(--wa-text-secondary)]">
              Your AI assistant. Ask me anything, or try one of these:
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => send(text)}
                  className="rounded-full border border-[color:var(--wa-chip-border)] bg-[var(--wa-chip-bg)] px-3.5 py-2 text-[13px] text-[color:var(--wa-chip-text)] transition hover:bg-[var(--wa-chip-hover)]"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const mine = message.role === "user";
          if (!mine && !message.content) return null; // typing dots shown below

          return (
            <div
              key={index}
              className={`wa-shadow-bubble max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-[14.5px] leading-5 text-[color:var(--wa-bubble-text)] sm:max-w-[65%] ${
                mine
                  ? "self-end rounded-tr-sm bg-[var(--wa-bubble-out-bg)]"
                  : "self-start rounded-tl-sm bg-[var(--wa-bubble-in-bg)]"
              }`}
            >
              {message.content}
            </div>
          );
        })}

        {showTyping && (
          <div className="wa-shadow-bubble flex w-fit items-center gap-1 self-start rounded-xl rounded-tl-sm bg-[var(--wa-bubble-in-bg)] px-3 py-3">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-2 w-2 animate-bounce rounded-full bg-[var(--wa-text-secondary)]"
                style={{ animationDelay: `${dot * 150}ms` }}
              />
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="self-center rounded-lg px-3 py-1.5 text-center text-[12.5px] text-[color:var(--wa-danger)]">
            {error}
          </p>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={submit}
        className="relative z-10 flex items-end gap-2 bg-[var(--wa-composer-bg)] px-3 py-2.5 sm:px-4"
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          maxLength={2000}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask HexaBot..."
          className="field-sizing-content max-h-32 min-h-[42px] flex-1 resize-none rounded-3xl border border-[color:var(--wa-border)] bg-[var(--wa-search-bg)] px-4 py-2.5 text-[15px] text-[color:var(--wa-composer-text)] outline-none placeholder:text-[color:var(--wa-composer-placeholder)] focus:border-[color:var(--wa-accent)]"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={stop}
            aria-label="Stop answer"
            className="grid size-[42px] shrink-0 place-items-center rounded-full bg-[var(--wa-send-bg)] text-[color:var(--wa-send-fg)] transition hover:bg-[var(--wa-send-hover)]"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message"
            className="grid size-[42px] shrink-0 place-items-center rounded-full bg-[var(--wa-send-bg)] text-[color:var(--wa-send-fg)] transition hover:bg-[var(--wa-send-hover)] disabled:opacity-50"
          >
            <SendHorizontal size={18} />
          </button>
        )}
      </form>

      <p className="relative z-10 bg-[var(--wa-composer-bg)] px-3 pb-2 text-center text-[11px] text-[color:var(--wa-text-secondary)] max-sm:hidden">
        AI can make mistakes. Don&apos;t share sensitive information.
      </p>

      {/* Phone only (hidden from the `sm` size up by the component itself) */}
      <MobileBottomNav />
    </section>
  );
}