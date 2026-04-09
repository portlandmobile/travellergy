import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/app/components/breadcrumb-json-ld";
import { DishIngredientsHighlight } from "@/app/components/dish-ingredients-highlight";
import { FreshnessBadge } from "@/app/components/freshness-badge";
import { SafetyPanel } from "@/app/components/safety-panel";
import { StalenessWarning } from "@/app/components/staleness-warning";
import { getDishDetails } from "@/lib/dish-details";
import { getRegionMeta } from "@/lib/seo-queries";
import { absoluteUrl } from "@/lib/site";

type DishPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let data = null;
  try {
    data = await getDishDetails(slug);
  } catch {
    return { title: "Dish" };
  }
  if (!data) {
    return {
      title: "Dish not found",
      robots: { index: false, follow: true },
    };
  }

  const title = data.dish.name_en;
  const description =
    data.dish.description?.trim().slice(0, 160) ||
    `Ingredients and allergen-risk context for ${data.dish.name_en} — browse on Travellergy before you order.`;
  const path = `/dishes/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: `${title} | Travellergy`,
      description,
      url: absoluteUrl(path),
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Travellergy`,
      description,
    },
  };
}

type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

function normalizeRisk(value: string): RiskLevel {
  const risk = value.toUpperCase();
  if (risk === "HIGH" || risk === "MEDIUM" || risk === "LOW") return risk;
  return "UNKNOWN";
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

export default async function DishPage({ params, searchParams }: DishPageProps) {
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

  let cityLabel = "City";
  if (from && cityReturn) {
    try {
      const rm = await getRegionMeta(from);
      if (rm?.name) cityLabel = rm.name;
    } catch {
      /* keep default */
    }
  }

  const breadcrumbItems =
    cityReturn !== null
      ? [
          { name: "Home", path: "/" },
          { name: cityLabel, path: cityReturn },
          { name: data.dish.name_en, path: `/dishes/${slug}` },
        ]
      : [
          { name: "Home", path: "/" },
          { name: data.dish.name_en, path: `/dishes/${slug}` },
        ];

  return (
    <section className="w-full max-w-3xl space-y-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Link href={backHref} className="text-sm underline">
        &larr; {backLabel}
      </Link>

      <StalenessWarning />

      <header className="space-y-4 rounded-xl border border-sage/20 bg-white/60 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-serif text-3xl text-charcoal">{data.dish.name_en}</h1>
          <FreshnessBadge />
        </div>
        {data.dish.description ? (
          <p className="text-sm leading-relaxed text-charcoal/80">
            {data.dish.description}
          </p>
        ) : null}
      </header>

      <SafetyPanel overallRisk={overallRisk} />

      <section className="space-y-4">
        <h3 className="font-serif text-xl text-charcoal">Ingredients</h3>
        <DishIngredientsHighlight ingredients={data.dish.ingredients} />
      </section>
    </section>
  );
}
