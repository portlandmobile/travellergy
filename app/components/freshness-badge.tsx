import {
  freshnessLabel,
  getContentFreshness,
  isStaleState,
} from "@/lib/content-freshness";

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FreshnessBadge({ className = "" }: { className?: string }) {
  const state = getContentFreshness();
  const label = freshnessLabel(state);
  const stale = isStaleState(state);

  const color =
    state.kind === "unknown"
      ? "border-gray-200 bg-gray-50 text-gray-900"
      : stale
        ? "border-gray-200 bg-gray-100 text-gray-900"
        : "border-teal-200 bg-teal-50 text-teal-900";

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${color} ${className}`}
    >
      <ClockIcon className="shrink-0 opacity-80" />
      {label}
    </span>
  );
}
