import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import FeaturedCityGrid from "./featured-city-grid";
import { getFeaturedRegions } from "@/lib/featured-regions";
import { PillSearchBar } from "@/app/components/PillSearchBar";
import { EditorialDiscoveryCard } from "@/app/components/EditorialDiscoveryCard";

export default async function Home() {
  const featuredRegions = await getFeaturedRegions(6);

  return (
    <section className="w-full space-y-12">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-sage/20 bg-white shadow-sm">
        <div
          className="relative flex h-[420px] w-full flex-col items-center justify-center gap-6 px-6 text-center text-travellergy-text"
        >
            <p className="text-sm uppercase tracking-[0.24em] text-travellergy-text/60">
              Travellergy
            </p>
            <h1 className="max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
              Where do you want to eat next?
            </h1>
            <p className="max-w-xl text-sm text-travellergy-text/70 sm:text-base">
              Explore city-specific allergen intelligence and discover dishes with confidence.
            </p>
            <PillSearchBar />
        </div>
      </div>

      {/* Featured Editorial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <EditorialDiscoveryCard 
          title="Tokyo's Hidden Izakayas"
          badge="Tokyo"
          imageSrc="https://images.unsplash.com/photo-1542367800-474c15374461?auto=format&fit=crop&w=800&q=80"
        />
        <EditorialDiscoveryCard 
          title="Street Food Secrets of Bangkok"
          badge="Bangkok"
          imageSrc="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-charcoal/70">
          Data freshness
        </span>
        <FreshnessBadge />
      </div>
      <StalenessWarning />
      <FeaturedCityGrid regions={featuredRegions} />
    </section>
  );
}
