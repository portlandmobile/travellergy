"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  initMixpanel,
  isMixpanelEnabled,
  type LinkClickPayload,
  trackLinkClick,
  trackPageView,
} from "@/lib/mixpanel-track";

function normalizeLinkText(el: Element): string {
  return (el.textContent ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 200);
}

function classifyLinkKind(
  url: URL,
  origin: string,
): LinkClickPayload["link_kind"] {
  const proto = url.protocol;
  if (proto === "mailto:") return "mailto";
  if (proto === "tel:") return "tel";
  if (proto === "file:") return "file";
  if (url.origin === origin) {
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      Boolean(url.hash)
    ) {
      return "hash";
    }
    return "internal";
  }
  if (proto === "http:" || proto === "https:") return "external";
  return "other";
}

function buildPayload(
  el: HTMLAnchorElement | HTMLAreaElement,
  e: MouseEvent,
): LinkClickPayload | null {
  const raw = el.getAttribute("href");
  if (raw == null || raw === "") return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("javascript:")) return null;

  let url: URL;
  try {
    url = new URL(trimmed, window.location.origin);
  } catch {
    return null;
  }

  const origin = window.location.origin;
  const kind = classifyLinkKind(url, origin);
  const opensNewTab =
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    el.target === "_blank" ||
    el.getAttribute("rel")?.includes("noopener") === true;

  return {
    link_href: trimmed,
    link_url_absolute: url.href,
    link_text: normalizeLinkText(el),
    link_kind: kind,
    opens_new_tab: opensNewTab,
    navigation_target: el.target || "_self",
  };
}

function MixpanelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isMixpanelEnabled()) return;
    initMixpanel();
    const search = searchParams?.toString() ?? "";
    trackPageView(pathname, search);
  }, [pathname, searchParams]);

  return null;
}

function MixpanelLinkCapture() {
  useEffect(() => {
    if (!isMixpanelEnabled()) return;

    const onClickCapture = (e: MouseEvent) => {
      if (!initMixpanel()) return;
      const el = (e.target as Element | null)?.closest?.(
        "a[href],area[href]",
      ) as HTMLAnchorElement | HTMLAreaElement | null;
      if (!el || !("href" in el)) return;

      const payload = buildPayload(el, e);
      if (!payload) return;

      trackLinkClick(payload);
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, []);

  return null;
}

export function MixpanelAnalytics() {
  if (!isMixpanelEnabled()) return null;

  return (
    <>
      <MixpanelLinkCapture />
      <Suspense fallback={null}>
        <MixpanelRouteTracker />
      </Suspense>
    </>
  );
}
