import { useState } from "react";
import { UserRound } from "lucide-react";

export default function Avatar({ user, size = 49 }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  return user?.profilePicture && !failed ? (
    <img
      src={user.profilePicture}
      alt=""
      style={style}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      style={style}
      className="grid shrink-0 place-items-center rounded-full bg-[var(--wa-avatar-neutral-bg)] text-[color:var(--wa-avatar-neutral-fg)]"
    >
      <UserRound size={Math.round(size / 2)} />
    </span>
  );
}