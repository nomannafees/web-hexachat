import { useState } from "react";
import { Plus } from "lucide-react";
import PanelSearch from "./PanelSearch";
import ChatList from "./ChatList";
import MobileBottomNav from "./MobileBottomNav";

const ASIDE =
  "relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--wa-sidebar-bg)] text-[color:var(--wa-text-primary)]";

/* The Groups link: every group you are in, newest activity first.
   `chats` is the full chat list; only the groups are shown here. */
export default function GroupsSidebar({ chats = [], selectedChatId, onSelectChat, onNewGroup }) {
  const [search, setSearch] = useState("");

  const groups = chats.filter((chat) => chat.type === "group");
  const needle = search.trim().toLowerCase();
  const visible = needle
    ? groups.filter((chat) => (chat.name || "").toLowerCase().includes(needle))
    : groups;

  return (
    <aside className={ASIDE}>
      <header className="flex h-[65px] shrink-0 select-none items-center justify-between px-4 sm:px-5">
        <h1 className="text-[22px] font-bold leading-none">
          Groups
          {groups.length > 0 && (
            <span className="ml-2 text-[15px] font-normal text-[color:var(--wa-text-secondary)]">{groups.length}</span>
          )}
        </h1>

        <button
          type="button"
          onClick={onNewGroup}
          aria-label="New group"
          title="New group"
          className="grid size-10 place-items-center rounded-full text-[color:var(--wa-header-icon)] transition-colors hover:bg-[var(--wa-hover)]"
        >
          <Plus size={22} />
        </button>
      </header>

      <PanelSearch value={search} onChange={setSearch} placeholder="Search groups" autoFocus={false} />

      <div className="whatsapp-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain max-sm:pb-20">
        {groups.length === 0 ? (
          <div className="px-8 py-10 text-center text-sm text-[color:var(--wa-text-secondary)]">
            <p>You are not in any group yet.</p>
            <button type="button" onClick={onNewGroup} className="mt-3 font-medium text-[color:var(--wa-accent)] hover:underline">
              Create a group
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="px-8 py-10 text-center text-sm text-[color:var(--wa-text-secondary)]">No groups match your search.</p>
        ) : (
          <ChatList chats={visible} selectedChatId={selectedChatId} onSelectChat={onSelectChat} />
        )}
      </div>

      <MobileBottomNav />
    </aside>
  );
}