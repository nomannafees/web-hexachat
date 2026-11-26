import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Headphones, Play, Plus, SendHorizontal, Upload, X } from "lucide-react";
import { FONT } from "../settings/constants";

const MAX_FILES = 10; // same as the server
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB per file, same as the server

const formatSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Files from a drop. Folders are skipped (the browser can't upload them).
function filesFrom(dataTransfer) {
  const items = Array.from(dataTransfer?.items || []);

  if (items.length > 0) {
    return items
      .filter((item) => item.kind === "file")
      .filter((item) => !item.webkitGetAsEntry?.()?.isDirectory)
      .map((item) => item.getAsFile())
      .filter(Boolean);
  }

  return Array.from(dataTransfer?.files || []);
}

/**
 * Popup for files dragged onto the chat: first "Drag files here", then a
 * preview with a description box and a Send button.
 * onSend(text, files) must return a promise (it is the chat's own send).
 */
export default function DropSendDialog({ onClose, onSend, isSending = false, uploadProgress = 0 }) {
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [isOver, setIsOver] = useState(false);

  const inputRef = useRef(null);

  // Temporary previews for images and videos (freed again when files change).
  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: /^(image|video)\//.test(file.type) ? URL.createObjectURL(file) : "",
      })),
    [files]
  );

  useEffect(
    () => () => previews.forEach((preview) => preview.url && URL.revokeObjectURL(preview.url)),
    [previews]
  );

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && !isSending && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, isSending]);

  function addFiles(list) {
    const incoming = Array.from(list || []);
    if (incoming.length === 0) return;

    const tooBig = incoming.find((file) => file.size > MAX_SIZE);
    if (tooBig) {
      setError(`"${tooBig.name}" is larger than 100 MB.`);
      return;
    }

    if (files.length + incoming.length > MAX_FILES) {
      setError(`You can send up to ${MAX_FILES} files at once.`);
      return;
    }

    setError("");
    setFiles((previous) => [...previous, ...incoming]);
  }

  const removeFile = (index) => setFiles((previous) => previous.filter((_, i) => i !== index));

  async function handleSend() {
    if (isSending || files.length === 0) return;

    setError("");

    try {
      await onSend(caption.trim(), files);
      onClose();
    } catch (sendError) {
      setError(sendError.response?.data?.message || sendError.message || "Failed to send. Please try again.");
    }
  }

  const handleDrop = (event) => {
    event.preventDefault();
    setIsOver(false);
    if (!isSending) addFiles(filesFrom(event.dataTransfer));
  };

  const handleDragLeave = (event) => {
    const { clientX: x, clientY: y } = event;
    const leftWindow = x <= 0 || y <= 0 || x >= window.innerWidth || y >= window.innerHeight;

    setIsOver(false);
    // Dragged out of the browser window without dropping anything.
    if (leftWindow && files.length === 0) onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Send files"
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSending) onClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--wa-overlay)] p-3 ${FONT}`}
    >
      <div
        className={`wa-shadow-modal relative flex max-h-[min(640px,calc(100dvh-24px))] w-[min(560px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl bg-[var(--wa-modal-bg)] text-[color:var(--wa-text-primary)] ${
          isOver ? "ring-2 ring-[color:var(--wa-accent)]" : ""
        }`}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center gap-3 px-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full hover:bg-[var(--wa-hover)] disabled:opacity-40"
          >
            <X size={22} />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-[17px]">
            {files.length === 0 ? "Send files" : `Send ${files.length} file${files.length > 1 ? "s" : ""}`}
          </h2>
          {files.length > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isSending || files.length >= MAX_FILES}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[color:var(--wa-accent)] hover:bg-[var(--wa-hover)] disabled:opacity-40"
            >
              <Plus size={16} />
              Add more
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />

        {files.length === 0 ? (
          /* Step 1: the drop zone */
          <div className="px-5 pb-6 pt-1">
            <div
              className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
                isOver
                  ? "border-[color:var(--wa-accent)] bg-[var(--wa-chip-active-bg)]"
                  : "border-[color:var(--wa-border)]"
              }`}
            >
              <span className="mb-4 grid size-16 place-items-center rounded-full bg-[var(--wa-chip-active-bg)] text-[color:var(--wa-accent)]">
                <Upload size={30} />
              </span>
              <p className="text-[20px] font-medium">Drag files here</p>
              <p className="mt-1 text-[13.5px] text-[color:var(--wa-text-secondary)]">
                Photos, videos and documents. Up to {MAX_FILES} files, 100 MB each.
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-5 rounded-full border border-[color:var(--wa-chip-border)] bg-[var(--wa-chip-bg)] px-4 py-2 text-sm font-medium hover:bg-[var(--wa-chip-hover)]"
              >
                Or choose files
              </button>
            </div>

            {error && <p className="mt-3 text-center text-[13px] text-[color:var(--wa-danger)]">{error}</p>}
          </div>
        ) : (
          /* Step 2: previews, description, send */
          <>
            <div className="whatsapp-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map(({ file, url }, index) => {
                  const isImage = file.type.startsWith("image/");
                  const isVideo = file.type.startsWith("video/");

                  return (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-[color:var(--wa-border)] bg-[var(--wa-menu-bg)]"
                    >
                      <div className="relative grid h-28 place-items-center bg-[var(--wa-hover)]">
                        {isImage && url ? (
                          <img src={url} alt={file.name} className="h-full w-full object-cover" />
                        ) : isVideo && url ? (
                          <>
                            <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                            <span className="pointer-events-none absolute grid size-9 place-items-center rounded-full bg-black/60 text-white">
                              <Play size={18} fill="currentColor" />
                            </span>
                          </>
                        ) : file.type.startsWith("audio/") ? (
                          <Headphones size={32} className="text-[color:var(--wa-icon)]" />
                        ) : (
                          <FileText size={32} className="text-[color:var(--wa-icon)]" />
                        )}

                        {!isSending && (
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            aria-label={`Remove ${file.name}`}
                            className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/65 text-white hover:bg-black/85"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>

                      <div className="px-2.5 py-1.5">
                        <p className="truncate text-xs text-[color:var(--wa-text-strong)]">{file.name}</p>
                        <p className="text-[11px] text-[color:var(--wa-text-secondary)]">{formatSize(file.size)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {isSending && (
              <div className="px-4 pb-2">
                <div className="mb-1 flex items-center justify-between text-xs text-[color:var(--wa-icon)]">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--wa-progress-track)]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={uploadProgress}
                >
                  <div
                    className="h-full rounded-full bg-[var(--wa-accent)] transition-[width] duration-200 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {error && <p className="px-5 pb-2 text-[13px] text-[color:var(--wa-danger)]">{error}</p>}

            {/* Description + send */}
            <div className="flex shrink-0 items-end gap-2 border-t border-[color:var(--wa-border)] bg-[var(--wa-composer-bg)] px-3 py-3">
              <textarea
                rows={1}
                value={caption}
                maxLength={1000}
                disabled={isSending}
                autoFocus
                onChange={(event) => setCaption(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Add a description"
                className="field-sizing-content max-h-28 min-h-[42px] flex-1 resize-none rounded-3xl border border-[color:var(--wa-border)] bg-[var(--wa-search-bg)] px-4 py-2.5 text-[15px] text-[color:var(--wa-composer-text)] outline-none placeholder:text-[color:var(--wa-composer-placeholder)] focus:border-[color:var(--wa-accent)] disabled:opacity-60"
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                aria-label="Send"
                className="grid size-[42px] shrink-0 place-items-center rounded-full bg-[var(--wa-send-bg)] text-[color:var(--wa-send-fg)] transition hover:bg-[var(--wa-send-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SendHorizontal size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}