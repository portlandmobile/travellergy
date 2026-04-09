import mixpanel from "mixpanel-browser";

/**
 * Production Mixpanel project token (Vercel Production + any deploy you treat as prod).
 */
const TOKEN_PROD = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN?.trim();
/**
 * Development Mixpanel project token (local `next dev`, Vercel Preview, etc.).
 */
const TOKEN_DEV = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN_DEV?.trim();

/** Inlined at build time from next.config `env` (see VERCEL_ENV on Vercel). */
const VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV?.trim() ?? "";

function shouldUseDevProject(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (VERCEL_ENV === "preview" || VERCEL_ENV === "development") return true;
  if (VERCEL_ENV === "production") return false;
  // Production build without Vercel (e.g. `next start` after build): treat as prod.
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

function resolveMixpanelToken(): string | undefined {
  const useDev = shouldUseDevProject();
  if (useDev) return TOKEN_DEV || TOKEN_PROD;
  return TOKEN_PROD || TOKEN_DEV;
}

const TOKEN = resolveMixpanelToken();

let initialized = false;

export function isMixpanelEnabled(): boolean {
  return Boolean(TOKEN);
}

export function initMixpanel(): boolean {
  if (!TOKEN) return false;
  if (initialized) return true;
  if (typeof window === "undefined") return false;

  mixpanel.init(TOKEN, {
    persistence: "localStorage",
    track_pageview: false,
  });
  initialized = true;
  return true;
}

export function trackPageView(pathname: string, search: string): void {
  if (!initMixpanel()) return;
  const url = `${pathname}${search ? `?${search}` : ""}`;
  mixpanel.track("$pageview", {
    path: pathname,
    url,
  });
}

export type LinkClickPayload = {
  link_href: string;
  link_url_absolute: string;
  link_text: string;
  link_kind: "internal" | "external" | "mailto" | "tel" | "file" | "hash" | "other";
  opens_new_tab: boolean;
  navigation_target: string;
};

export function trackLinkClick(payload: LinkClickPayload): void {
  if (!initMixpanel()) return;
  mixpanel.track("Link Click", payload);
}
