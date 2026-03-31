import { FreshnessBadge } from "@/app/components/freshness-badge";
import { StalenessWarning } from "@/app/components/staleness-warning";
import RegionSearchBar from "./region-search-bar";

export default function Home() {
  return (
    <section className="w-full space-y-4">
      <p className="text-base text-black">Travellergy</p>
      <StalenessWarning />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-black/70">Data freshness</span>
        <FreshnessBadge />
      </div>
      <RegionSearchBar />
    </section>
  );
}
