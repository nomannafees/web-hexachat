import { Copy, Forward, Star, StarOff, Trash2, X } from "lucide-react";

export default function SelectionBar({
  count,
  allStarred,
  canCopy,
  canForward,
  onClose,
  onStar,
  onCopy,
  onForward,
  onDelete,
}) {
  const btn =
    "grid size-11 shrink-0 place-items-center rounded-full text-[color:var(--wa-chat-header-icon)] transition-colors hover:bg-[var(--wa-hover)] active:bg-[var(--wa-pressed)] disabled:opacity-40";

  return (
    <header className="relative z-30 flex h-[calc(56px+env(safe-area-inset-top))] w-full shrink-0 items-center justify-between border-b border-[color:var(--wa-chat-header-border)] bg-[var(--wa-chat-header-bg)] pl-1 pr-2 pt-[env(safe-area-inset-top)] sm:h-[65px] sm:px-4 sm:pt-0">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Cancel selection" onClick={onClose} className={btn}>
          <X size={22} />
        </button>
        <span className="text-[17px] text-[color:var(--wa-chat-title)]">{count} selected</span>
      </div>

      <div className="flex items-center sm:gap-2">
        <button type="button" title={allStarred ? "Unstar" : "Star"} onClick={onStar} className={btn}>
          {allStarred ? <StarOff size={21} /> : <Star size={21} />}
        </button>
        <button type="button" title="Copy" disabled={!canCopy} onClick={onCopy} className={btn}>
          <Copy size={21} />
        </button>
        <button type="button" title="Forward" disabled={!canForward} onClick={onForward} className={btn}>
          <Forward size={21} />
        </button>
        <button type="button" title="Delete" onClick={onDelete} className={btn}>
          <Trash2 size={21} />
        </button>
      </div>
    </header>
  );
}