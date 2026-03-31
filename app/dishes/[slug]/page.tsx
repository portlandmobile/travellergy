import Link from "next/link";
import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import { getDishDetails } from "@/lib/dish-details";

type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

function normalizeRisk(value: string): RiskLevel {
  const risk = value.toUpperCase();
  if (risk === "HIGH" || risk === "MEDIUM" || risk === "LOW") return risk;
  return "UNKNOWN";
}

function riskBadgeClass(level: RiskLevel): string {
  if (level === "HIGH") return "bg-red-100 text-red-800";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-800";
  if (level === "LOW") return "bg-teal-100 text-teal-800";
  return "bg-gray-100 text-gray-700";
}

function overallRiskLevel(risks: string[]): RiskLevel {
  const normalized = risks.map(normalizeRisk);
  if (normalized.includes("HIGH")) return "HIGH";
  if (normalized.includes("MEDIUM")) return "MEDIUM";
  if (normalized.includes("LOW")) return "LOW";
  return "UNKNOWN";
}

/** Allow only safe region/city slug segments for return links (no open redirects). */
function cityBackHref(from: string | undefined): string | null {
  if (!from || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(from)) return null;
  return `/city/${from}`;
}

export default async function DishPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const cityReturn = cityBackHref(from);
  const backHref = cityReturn ?? "/";
  const backLabel = cityReturn ? "Back to city" : "Back";

  let data: Awaited<ReturnType<typeof getDishDetails>> = null;
  try {
    data = await getDishDetails(slug);
  } catch {
    return (
      <section className="w-full space-y-4">
        <Link href={backHref} className="text-sm underline">
          &larr; {backLabel}
        </Link>
        <h2 className="text-2xl font-semibold">Unable to load dish details</h2>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="w-full space-y-4">
        <Link href={backHref} className="text-sm underline">
          &larr; {backLabel}
        </Link>
        <h2 className="text-2xl font-semibold">Dish not found</h2>
      </section>
    );
  }

  const risks = data.dish.ingredients.map((item) => item.allergen_risk);
  const overallRisk = overallRiskLevel(risks);

  return (
    <section className="w-full max-w-3xl space-y-6">
      <Link href={backHref} className="text-sm underline">
        &larr; {backLabel}
      </Link>

      <StalenessWarning />

      <header className="space-y-3 rounded-lg border border-black/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold">{data.dish.name_en}</h2>
          <FreshnessBadge />
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${riskBadgeClass(overallRisk)}`}
        >
          Risk: {overallRisk}
        </span>
        {data.dish.description && (
          <p className="text-sm text-black/80">{data.dish.description}</p>
        )}
      </header>

      <section className="space-y-3 rounded-lg border border-black/10 p-5">
        <h3 className="text-lg font-semibold">Ingredients</h3>
        {data.dish.ingredients.length === 0 ? (
          <p className="text-sm text-black/70">No ingredient data available.</p>
        ) : (
          <ul className="space-y-2">
            {data.dish.ingredients.map((item) => {
              const ingredientRisk = normalizeRisk(item.allergen_risk);
              return (
                <li
                  key={`${item.name}-${item.is_hidden ? "hidden" : "visible"}`}
                  className="space-y-2 rounded-md border border-black/10 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.name}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${riskBadgeClass(ingredientRisk)}`}
                    >
                      {ingredientRisk}
                    </span>
                  </div>
                  {item.is_hidden && (
                    <p className="text-sm font-medium text-red-700">
                      Hidden ingredient warning
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
