import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/app/components/breadcrumb-json-ld";
import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import { absoluteUrl } from "@/lib/site";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type VenuePageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: VenuePageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data: location } = await supabase
    .from("locations")
    .select("name, regions (slug, name)")
    .eq("id", id)
    .maybeSingle();

  if (!location) {
    return {
      title: "Venue not found",
      robots: { index: false, follow: true },
    };
  }

  const title = `${location.name} — venue`;
  const description = `Venue listing for ${location.name} on Travellergy — part of regional dining intelligence.`;
  const path = `/venues/${id}`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: `${location.name} | Travellergy`,
      description,
      url: absoluteUrl(path),
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${location.name} | Travellergy`,
      description,
    },
  };
}

export default async function VenuePlaceholderPage({ params }: VenuePageProps) {
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

  const path = `/venues/${id}`;

  return (
    <section className="w-full max-w-3xl space-y-6">
      {region ? (
        <BreadcrumbJsonLd
          items={[
            { name: "Home", path: "/" },
            { name: region.name, path: `/city/${region.slug}` },
            { name: location.name, path },
          ]}
        />
      ) : (
        <BreadcrumbJsonLd
          items={[
            { name: "Home", path: "/" },
            { name: location.name, path },
          ]}
        />
      )}
      <Link
        href={region ? `/city/${region.slug}` : "/"}
        className="text-sm underline"
      >
        &larr; Back to {region?.name ?? "city"}
      </Link>

      <StalenessWarning />

      <header className="space-y-3 rounded-lg border border-black/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold">{location.name}</h1>
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
