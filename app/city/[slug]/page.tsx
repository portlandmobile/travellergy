import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/app/components/breadcrumb-json-ld";
import CityHubClient from "@/app/components/city-hub-client";
import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import { listEcosystemsForRegionSlug } from "@/lib/culinary-ecosystems";
import { getRegionLocations } from "@/lib/region-locations";
import { getRegionDishes } from "@/lib/regions-dishes";
import { getRegionMeta } from "@/lib/seo-queries";
import { absoluteUrl } from "@/lib/site";

type CityPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  let region = null;
  try {
    region = await getRegionMeta(slug);
  } catch {
    return { title: "City" };
  }
  if (!region) {
    return {
      title: "City not found",
      robots: { index: false, follow: true },
    };
  }

  const title = `${region.name} — Dining & allergen guide`;
  const description = `Explore dishes and ingredient patterns in ${region.name} (${region.country_code}). Filter by allergen and plan safer meals when you travel.`;
  const path = `/city/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: `${title} | Travellergy`,
      description,
      url: absoluteUrl(path),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Travellergy`,
      description,
    },
  };
}

export default async function CityPage({
  params,
}: CityPageProps) {
  const { slug } = await params;
  let data: Awaited<ReturnType<typeof getRegionDishes>> = null;
  try {
    data = await getRegionDishes(slug);
  } catch {
    return (
      <section className="w-full space-y-4">
        <Link href="/" className="text-sm underline">
          &larr; Back
        </Link>
        <h2 className="text-2xl font-semibold">Unable to load city intelligence</h2>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="w-full space-y-4">
        <Link href="/" className="text-sm underline">
          &larr; Back
        </Link>
        <h2 className="text-2xl font-semibold">City not found</h2>
      </section>
    );
  }

  let locationsData: Awaited<ReturnType<typeof getRegionLocations>> = null;
  try {
    locationsData = await getRegionLocations(slug);
  } catch {
    locationsData = null;
  }

  let ecosystems: Awaited<ReturnType<typeof listEcosystemsForRegionSlug>> = [];
  try {
    ecosystems = await listEcosystemsForRegionSlug(slug);
  } catch {
    ecosystems = [];
  }

  return (
    <section className="w-full max-w-6xl space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: data.region.name, path: `/city/${slug}` },
        ]}
      />
      <Link href="/" className="text-sm underline">
        &larr; Back
      </Link>

      <StalenessWarning />

      <header className="space-y-3 rounded-lg border border-black/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold">{data.region.name}</h1>
          <FreshnessBadge />
        </div>
        <p className="text-sm text-black/70">
          Regional intelligence based on current culinary patterns.
        </p>
      </header>

      {ecosystems.length > 0 && (
        <section className="space-y-3 rounded-lg border border-sage/20 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-charcoal">
            Culinary safety hubs
          </h3>
          <p className="text-sm text-charcoal/65">
            Deeper context for specific food cultures in this city — risks,
            patterns, and local-language safety cards.
          </p>
          <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {ecosystems.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/city/${slug}/ecosystem/${e.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-sage/30 bg-sage/5 px-4 py-2 text-sm font-medium text-sage transition hover:border-sage/50 hover:bg-sage/10"
                >
                  <span>{e.name_en}</span>
                  {e.name_local && (
                    <span className="text-charcoal/70">{e.name_local}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CityHubClient citySlug={slug} dishes={data.dishes} />

      <section className="space-y-3 rounded-lg border border-black/10 p-5">
        <h3 className="text-lg font-semibold">View Venues</h3>
        <p className="text-sm text-black/70">Top verified venues for this region.</p>
        {!locationsData || locationsData.locations.length === 0 ? (
          <p className="text-sm text-black/70">No venues listed yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {locationsData.locations.map((loc) => (
              <li key={loc.id}>
                <Link
                  href={`/venues/${loc.id}`}
                  className="block rounded-lg border border-black/10 bg-white p-4 transition hover:border-black/30"
                >
                  <span className="font-medium">{loc.name}</span>
                  {loc.dish_name && (
                    <p className="mt-1 text-xs text-black/60">
                      Specialty: {loc.dish_name}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
