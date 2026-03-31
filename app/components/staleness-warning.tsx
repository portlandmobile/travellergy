import { getContentFreshness, isStaleState } from "@/lib/content-freshness";

export function StalenessWarning({ className = "" }: { className?: string }) {
  const state = getContentFreshness();
  if (!isStaleState(state)) return null;

  return (
    <div
      role="alert"
      className={`rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950 ${className}`}
    >
      Warning: Stale — regional culinary intelligence may be out of date.
    </div>
  );
}
