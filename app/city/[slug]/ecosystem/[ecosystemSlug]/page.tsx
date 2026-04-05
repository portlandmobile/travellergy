import type { Metadata } from "next";
import Link from "next/link";
import CityHubClient from "@/app/components/city-hub-client";
import { EcosystemSafetyCardTool } from "@/app/components/ecosystem-safety-card-tool";
import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import { getEcosystemInRegion } from "@/lib/culinary-ecosystems";
import { getRegionDishes } from "@/lib/regions-dishes";

type Props = { params: Promise<{ slug: string; ecosystemSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, ecosystemSlug } = await params;
  const eco = await getEcosystemInRegion({
    regionSlug: slug,
    ecosystemSlug,
  });
  if (!eco) {
    return { title: "Hub not found | Travellergy" };
  }
  const title = `${eco.name_en} — ${slug} | Travellergy`;
  const description =
    eco.seo_description?.trim() ||
    eco.description?.trim() ||
    `Culinary safety intelligence for ${eco.name_en} in this region.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function EcosystemHubPage({ params }: Props) {
  const { slug, ecosystemSlug } = await params;

  const [eco, dishData] = await Promise.all([
    getEcosystemInRegion({ regionSlug: slug, ecosystemSlug }),
    getRegionDishes(slug),
  ]);

  if (!eco || !dishData) {
    return (
      <section className="w-full space-y-4">
        <Link href="/" className="text-sm underline">
          &larr; Back
        </Link>
        <h2 className="text-2xl font-semibold">Hub not found</h2>
        <p className="text-sm text-black/70">
          This culinary hub is not linked to this city yet.
        </p>
      </section>
    );
  }

  const dishOptions = dishData.dishes.map((d) => ({
    slug: d.slug,
    name_en: d.name_en,
  }));

  return (
    <section className="w-full max-w-6xl space-y-8">
      <Link href={`/city/${slug}`} className="text-sm underline">
        &larr; Back to {dishData.region.name}
      </Link>

      <StalenessWarning />

      <header className="space-y-3 rounded-lg border border-black/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">
              Culinary safety hub
            </p>
            <h1 className="mt-1 font-serif text-3xl text-charcoal">
              {eco.name_en}
            </h1>
            {eco.name_local && (
              <p className="mt-1 text-lg text-charcoal/80">{eco.name_local}</p>
            )}
            <p className="mt-2 text-sm text-black/70">
              {dishData.region.name} · Itinerary anchor with regional dish
              intelligence
            </p>
          </div>
          <FreshnessBadge />
        </div>
        {eco.description && (
          <p className="max-w-3xl text-sm leading-relaxed text-charcoal/80">
            {eco.description}
          </p>
        )}
      </header>

      <EcosystemSafetyCardTool dishes={dishOptions} />

      <CityHubClient citySlug={slug} dishes={dishData.dishes} />
    </section>
  );
}
