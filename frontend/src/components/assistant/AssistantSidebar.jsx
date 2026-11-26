import { Lock, MessageSquareText, ShieldCheck } from "lucide-react";
import AssistantIcon from "./AssistantIcon";

const ASIDE =
  "flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--wa-sidebar-bg)] text-[color:var(--wa-text-primary)]";

const POINTS = [
  { icon: MessageSquareText, text: "Ask questions, get quick answers" },
  { icon: Lock, text: "Your conversation is saved only in this browser" },
  { icon: ShieldCheck, text: "AI can make mistakes. Don't share sensitive information" },
];

/* Left column while the Assistant link is open (computer screens only;
   on a phone the assistant takes the whole screen). */
export default function AssistantSidebar() {
  return (
    <aside className={ASIDE}>
      <header className="flex h-[65px] shrink-0 select-none items-center px-4 sm:px-5">
        <h1 className="text-[22px] font-bold leading-none">Assistant</h1>
      </header>

      <div className="px-2.5">
        <div className="flex h-[72px] items-center gap-3.5 rounded-xl bg-[var(--wa-row-active)] px-3">
          <span className="grid size-[49px] shrink-0 place-items-center rounded-full bg-[var(--wa-chip-active-bg)]">
            <AssistantIcon size={30} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[17px] leading-[21px]">HexaBot</p>
            <p className="truncate text-[14px] text-[color:var(--wa-text-secondary)]">AI assistant</p>
          </div>
        </div>
      </div>

      <ul className="mt-6 space-y-4 px-6">
        {POINTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-[14px] leading-5 text-[color:var(--wa-text-secondary)]">
            <Icon size={18} className="mt-0.5 shrink-0" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}