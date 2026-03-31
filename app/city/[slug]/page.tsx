import Link from "next/link";
import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import { getRegionLocations } from "@/lib/region-locations";
import { getRegionDishes, type RegionDishRiskLevel } from "@/lib/regions-dishes";

type Dish = {
  slug: string;
  name_en: string;
  prevalence: string;
  risk_level: RegionDishRiskLevel;
};

function riskBadgeClass(level: RegionDishRiskLevel): string {
  if (level === "HIGH") return "bg-red-100 text-red-800";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-800";
  if (level === "LOW") return "bg-teal-100 text-teal-800";
  return "bg-gray-100 text-gray-700";
}

function overallRiskLevel(dishes: Dish[]): RegionDishRiskLevel {
  if (dishes.some((dish) => dish.risk_level === "HIGH")) return "HIGH";
  if (dishes.some((dish) => dish.risk_level === "MEDIUM")) return "MEDIUM";
  if (dishes.some((dish) => dish.risk_level === "LOW")) return "LOW";
  return "UNKNOWN";
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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

  const overallRisk = overallRiskLevel(data.dishes);

  let locationsData: Awaited<ReturnType<typeof getRegionLocations>> = null;
  try {
    locationsData = await getRegionLocations(slug);
  } catch {
    locationsData = null;
  }

  return (
    <section className="w-full max-w-3xl space-y-6">
      <Link href="/" className="text-sm underline">
        &larr; Back
      </Link>

      <StalenessWarning />

      <header className="space-y-3 rounded-lg border border-black/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold">{data.region.name}</h2>
          <FreshnessBadge />
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${riskBadgeClass(overallRisk)}`}
        >
          Risk: {overallRisk}
        </span>
        <p className="text-sm text-black/70">
          Regional intelligence based on current culinary patterns.
        </p>
      </header>

      <section className="space-y-3 rounded-lg border border-black/10 p-5">
        <h3 className="text-lg font-semibold">Top Culinary Patterns</h3>
        {data.dishes.length === 0 ? (
          <p className="text-sm text-black/70">No data available for this city yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.dishes.map((dish) => (
              <li
                key={dish.slug}
                className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2"
              >
                <Link
                  href={`/dishes/${dish.slug}?from=${encodeURIComponent(slug)}`}
                  className="font-medium underline"
                >
                  {dish.name_en}
                </Link>
                <span className="text-sm text-black/70">
                  {dish.prevalence.charAt(0) + dish.prevalence.slice(1).toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

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
