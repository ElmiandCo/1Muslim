"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../utils/supabase/client";

type PresencePayload = { user_id?: string; online_at?: string };

function readOnlineIds(state: Record<string, PresencePayload[]>) {
  const ids = new Set<string>();
  Object.values(state).forEach((entries) => {
    entries.forEach((entry) => {
      if (entry?.user_id) ids.add(entry.user_id);
    });
  });
  return ids;
}

export function useOnlinePresence() {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      channel = supabase.channel("onemuslim-online", {
        config: {
          private: true,
          presence: { key: user.id },
        },
      });

      const sync = () => {
        if (!active || !channel) return;
        setOnlineIds(readOnlineIds(channel.presenceState() as Record<string, PresencePayload[]>));
      };

      channel
        .on("presence", { event: "sync" }, sync)
        .on("presence", { event: "join" }, sync)
        .on("presence", { event: "leave" }, sync)
        .subscribe(async (status, err) => {
          if (status === "SUBSCRIBED") {
            await channel?.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error("OneMuslim online presence error:", status, err);
          }
        });
    })();

    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return onlineIds;
}

export function OnlineDot({ online, label = "Online" }: { online: boolean; label?: string }) {
  if (!online) return null;
  return (
    <span className="onlineStatus" aria-label={label}>
      <span className="onlineDot" aria-hidden="true" />
      {label}
    </span>
  );
}

export default function OnlinePresence({ userId }: { userId: string }) {
  const onlineIds = useOnlinePresence();
  const online = useMemo(() => onlineIds.has(userId), [onlineIds, userId]);
  return <OnlineDot online={online} />;
}
