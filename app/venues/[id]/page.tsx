import Link from "next/link";
import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function VenuePlaceholderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: location, error } = await supabase
    .from("locations")
    .select("id,name,regions (slug,name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <section className="w-full space-y-4">
        <Link href="/" className="text-sm underline">
          &larr; Back
        </Link>
        <h2 className="text-2xl font-semibold">Unable to load venue</h2>
      </section>
    );
  }

  if (!location) {
    return (
      <section className="w-full space-y-4">
        <Link href="/" className="text-sm underline">
          &larr; Back
        </Link>
        <h2 className="text-2xl font-semibold">Venue not found</h2>
      </section>
    );
  }

  const rawRegions = location.regions as
    | { slug: string; name: string }
    | { slug: string; name: string }[]
    | null;
  const region = Array.isArray(rawRegions) ? rawRegions[0] ?? null : rawRegions;

  return (
    <section className="w-full max-w-3xl space-y-6">
      <Link
        href={region ? `/city/${region.slug}` : "/"}
        className="text-sm underline"
      >
        &larr; Back to {region?.name ?? "city"}
      </Link>

      <StalenessWarning />

      <header className="space-y-3 rounded-lg border border-black/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold">{location.name}</h2>
          <FreshnessBadge />
        </div>
        <p className="text-sm text-black/70">
          Venue detail page placeholder. Full validation reports and actions
          will ship in a later slice.
        </p>
      </header>
    </section>
  );
}
