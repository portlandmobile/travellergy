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
import { getFeaturedRegions } from "@/lib/featured-regions";

export default async function Home() {
  const cookieStore = await cookies();
  const shownIds = parseSafetySpotlightSeenCookie(
    cookieStore.get(SAFETY_SPOTLIGHT_SEEN_COOKIE)?.value,
  );

  const [featuredRegions, spotlightResult] = await Promise.all([
    getFeaturedRegions(6),
    getHomeSafetySpotlights(2, shownIds),
  ]);
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
        <div className="relative flex h-[420px] w-full flex-col items-center justify-center gap-6 px-6 text-center text-travellergy-text">
          <p className="text-sm uppercase tracking-[0.24em] text-travellergy-text/60">
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
      <FeaturedCityGrid regions={featuredRegions} />
    </section>
  );
}
