import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import { SafetySpotlightCard } from "@/app/components/SafetySpotlightCard";
import { SpotlightSessionRecorder } from "@/app/components/SpotlightSessionRecorder";
import { PillSearchBar } from "@/app/components/PillSearchBar";
import { getHomeSafetySpotlights } from "@/lib/safety-spotlights";
import {
  parseSafetySpotlightSeenCookie,
  SAFETY_SPOTLIGHT_SEEN_COOKIE,
} from "@/lib/safety-spotlights-session";
import FeaturedCityGrid from "./featured-city-grid";
import {
  getFeaturedRegions,
  splitFeaturedRegionsForCarousel,
} from "@/lib/featured-regions";
import { brandWordmark } from "@/lib/fonts";
import { absoluteUrl } from "@/lib/site";

const HOME_TITLE = "Allergen intelligence for travelers";
const HOME_DESCRIPTION =
  "Discover city-by-city dining patterns, compare destinations, and explore dishes with ingredient and allergen context — curated for people who travel with food allergies.";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title: `${HOME_TITLE} | Travellergy`,
    description: HOME_DESCRIPTION,
    url: absoluteUrl("/"),
    type: "website",
  },
  twitter: {
    title: `${HOME_TITLE} | Travellergy`,
    description: HOME_DESCRIPTION,
  },
};

export default async function Home() {
  const cookieStore = await cookies();
  const shownIds = parseSafetySpotlightSeenCookie(
    cookieStore.get(SAFETY_SPOTLIGHT_SEEN_COOKIE)?.value,
  );

  const [featuredRegions12, spotlightResult] = await Promise.all([
    getFeaturedRegions(12),
    getHomeSafetySpotlights(2, shownIds),
  ]);
  const [featuredSetA, featuredSetB] =
    splitFeaturedRegionsForCarousel(featuredRegions12);
  const { spotlights, sessionReset } = spotlightResult;
  const spotlightRecordKey = spotlights
    .map((s) => s.id)
    .sort()
    .join("|");

  return (
    <section className="w-full space-y-12">
      {/* Safety spotlights (FR-09): regional risk, tips, phrases — session rotation */}
      <section
        className="space-y-4"
        aria-labelledby="safety-spotlights-heading"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="safety-spotlights-heading"
              className="font-serif text-xl text-charcoal sm:text-2xl"
            >
              Safety spotlights
            </h2>
            <p className="mt-1 max-w-xl text-sm text-charcoal/65">
              Short, actionable intelligence: hidden allergens, regional risks,
              and phrases that help you communicate clearly.
            </p>
          </div>
        </div>
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {spotlights.map((s) => (
            <li key={s.id}>
              <SafetySpotlightCard
                title={s.title}
                content={s.content}
                category={s.category}
                regionLabel={s.regionLabel}
                imageSrc={s.imageSrc}
                href={s.href}
              />
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-charcoal/55">
          Always confirm ingredients with venue staff.
        </p>
      </section>

      <SpotlightSessionRecorder
        recordKey={spotlightRecordKey}
        spotlightIds={spotlights.map((s) => s.id)}
        sessionReset={sessionReset}
      />

      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-sage/20 bg-white shadow-sm">
        <div className="relative flex min-h-[280px] w-full flex-col items-center justify-center gap-3 px-6 py-8 text-center text-travellergy-text sm:min-h-[300px] sm:gap-3.5 sm:py-9">
          <p
            className={`${brandWordmark.className} text-lg font-bold tracking-[-0.04em] text-sage sm:text-xl`}
          >
            Travellergy
          </p>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
            Where do you want to eat next?
          </h1>
          <p className="max-w-xl text-sm text-travellergy-text/70 sm:text-base">
            Explore city-specific allergen intelligence and discover dishes with
            confidence.
          </p>
          <PillSearchBar />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-charcoal/70">
          Data freshness
        </span>
        <FreshnessBadge />
      </div>
      <StalenessWarning />
      <FeaturedCityGrid setA={featuredSetA} setB={featuredSetB} />
    </section>
  );
}
