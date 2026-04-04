"use client";

import { useEffect } from "react";

/**
 * Uses `fetch` to a Route Handler (not a Server Action) so Next.js does not run a
 * full RSC refresh after `cookies().set` — that refresh was re-running the home page
 * with the new cookie and swapping spotlight cards in a tight loop (visible flashing).
 */
let lastPostedCompositeKey: string | null = null;

export function SpotlightSessionRecorder({
  recordKey,
  spotlightIds,
  sessionReset,
}: {
  recordKey: string;
  spotlightIds: string[];
  sessionReset: boolean;
}) {
  useEffect(() => {
    if (!recordKey || spotlightIds.length === 0) return;
    const composite = `${recordKey}\0${sessionReset}`;
    if (composite === lastPostedCompositeKey) return;
    lastPostedCompositeKey = composite;

    void fetch("/api/spotlight-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: spotlightIds,
        replaceAll: sessionReset,
      }),
      keepalive: true,
    }).catch(() => {
      /* non-critical */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids align with recordKey from server
  }, [recordKey, sessionReset]);

  return null;
}
