import { useEffect, useRef, useState } from "react";
import { SendHorizontal, Square, Trash2, X, Sparkles } from "lucide-react";
import AssistantIcon from "./AssistantIcon";
import useAssistant from "./useAssistant";

const SUGGESTIONS = [
  "How do chat requests work?",
  "Help me write a polite message",
  "Give me a fun icebreaker",
];

/* Floating assistant: a round button at the bottom-right of the chat area.
   Click it to open the panel. All colors come from theme.css. */
export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { messages, isStreaming, error, send, stop, clear } = useAssistant();

  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the newest text in view.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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
    if (event.key === "Escape") setOpen(false);
  };

  const last = messages[messages.length - 1];
  const showTyping = isStreaming && last?.role === "assistant" && !last.content;

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label="HexaBot assistant"
          className="wa-shadow-modal absolute z-30 flex flex-col overflow-hidden bg-[var(--wa-menu-bg)] max-sm:inset-0 sm:bottom-[152px] sm:right-5 sm:h-[min(540px,calc(100%_-_172px))] sm:w-[380px] sm:rounded-2xl sm:border sm:border-[color:var(--wa-border)]"
        >
          {/* Header */}
          <header className="flex items-center gap-3 bg-[var(--wa-drawer-header-bg)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-[color:var(--wa-drawer-header-fg)]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white">
  <AssistantIcon size={22} />
</span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-tight">HexaBot</p>
              <p className="text-[12px] opacity-80">
                {isStreaming ? "Typing..." : "AI assistant"}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clear}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/15"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/15"
            >
              <X size={20} />
            </button>
          </header>

          {/* Messages */}
          <div
            ref={listRef}
            aria-live="polite"
            className="whatsapp-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[var(--wa-chat-bg)] px-3 py-4"
          >
            {messages.length === 0 && (
              <div className="m-auto flex max-w-[280px] flex-col items-center text-center">
                <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-[var(--wa-chip-active-bg)] text-[color:var(--wa-accent)]">
                  <AssistantIcon size={32} />
                </span>
                <p className="text-[16px] font-semibold text-[color:var(--wa-text-primary)]">
                  Hi, I&apos;m HexaBot
                </p>
                <p className="mt-1 text-[13px] leading-5 text-[color:var(--wa-text-secondary)]">
                  Ask me anything, or try one of these:
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => send(text)}
                      className="rounded-full border border-[color:var(--wa-chip-border)] bg-[var(--wa-chip-bg)] px-3 py-1.5 text-[12.5px] text-[color:var(--wa-chip-text)] transition hover:bg-[var(--wa-chip-hover)]"
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
                  className={`wa-shadow-bubble max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-[14px] leading-5 text-[color:var(--wa-bubble-text)] ${
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
              <p
                role="alert"
                className="self-center rounded-lg px-3 py-1.5 text-center text-[12.5px] text-[color:var(--wa-danger)]"
              >
                {error}
              </p>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={submit}
            className="flex items-end gap-2 border-t border-[color:var(--wa-border)] bg-[var(--wa-composer-bg)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={2000}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask HexaBot..."
              className="field-sizing-content max-h-28 min-h-[40px] flex-1 resize-none rounded-2xl border border-[color:var(--wa-border)] bg-[var(--wa-search-bg)] px-4 py-2 text-[14px] text-[color:var(--wa-composer-text)] outline-none placeholder:text-[color:var(--wa-composer-placeholder)] focus:border-[color:var(--wa-accent)]"
            />

            {isStreaming ? (
              <button
                type="button"
                onClick={stop}
                aria-label="Stop answer"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--wa-send-bg)] text-[color:var(--wa-send-fg)] transition hover:bg-[var(--wa-send-hover)]"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--wa-send-bg)] text-[color:var(--wa-send-fg)] transition hover:bg-[var(--wa-send-hover)] disabled:opacity-50"
              >
                <SendHorizontal size={18} />
              </button>
            )}
          </form>

          <p className="bg-[var(--wa-composer-bg)] px-3 pb-2 text-center text-[11px] text-[color:var(--wa-text-secondary)] max-sm:hidden">
            AI can make mistakes. Don&apos;t share sensitive information.
          </p>
        </section>
      )}

      {/* The round bubble. On phones it hides while the panel is open. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close assistant" : "Open HexaBot assistant"}
        aria-expanded={open}
        className={`wa-shadow-float absolute right-5 z-30 grid h-14 w-14 place-items-center rounded-full border border-[color:var(--wa-border)] bg-[var(--wa-menu-bg)] text-[color:var(--wa-text-primary)] transition hover:bg-[var(--wa-hover)] active:scale-95 bottom-[84px] max-sm:bottom-[calc(84px_+_env(safe-area-inset-bottom))] ${
          open ? "max-sm:hidden" : ""
        }`}
      >
        {open ? <X size={24} /> : <Sparkles size={24} />}
      </button>
    </>
  );
}