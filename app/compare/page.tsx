import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import { getRegionDishes } from "@/lib/regions-dishes";
import { parseCompareCitySlugs } from "@/lib/compare-parse";
import CompareTool, { type CompareColumn } from "./compare-tool";

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
