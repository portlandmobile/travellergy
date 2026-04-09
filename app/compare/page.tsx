import type { Metadata } from "next";
import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import { getRegionDishes } from "@/lib/regions-dishes";
import { parseCompareCitySlugs } from "@/lib/compare-parse";
import { absoluteUrl } from "@/lib/site";
import CompareTool, { type CompareColumn } from "./compare-tool";

const COMPARE_TITLE = "Compare cities";
const COMPARE_DESCRIPTION =
  "Compare allergen-relevant dish patterns across cities side by side — useful when choosing where to travel with food allergies.";

export const metadata: Metadata = {
  title: COMPARE_TITLE,
  description: COMPARE_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/compare") },
  openGraph: {
    title: `${COMPARE_TITLE} | Travellergy`,
    description: COMPARE_DESCRIPTION,
    url: absoluteUrl("/compare"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${COMPARE_TITLE} | Travellergy`,
    description: COMPARE_DESCRIPTION,
  },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ cities?: string }>;
}) {
  const { cities } = await searchParams;
  const slugs = parseCompareCitySlugs(cities);

  const columns: CompareColumn[] = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const data = await getRegionDishes(slug);
        if (!data) {
          return { slug, error: "not_found" as const };
        }
        return {
          slug,
          name: data.region.name,
          dishes: data.dishes,
        };
      } catch {
        return { slug, error: "load_error" as const };
      }
    }),
  );

  return (
    <div className="w-full space-y-4">
      <StalenessWarning />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-black/70">Data freshness</span>
        <FreshnessBadge />
      </div>
      <CompareTool slugs={slugs} columns={columns} />
    </div>
  );
}
