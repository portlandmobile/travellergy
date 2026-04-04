"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { FeaturedRegion } from "@/lib/featured-regions";

type Props = {
  regions: FeaturedRegion[];
};

export default function FeaturedCityGrid({ regions }: Props) {
  const router = useRouter();

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-charcoal">Featured Cities</h2>
        <span className="text-xs uppercase tracking-[0.18em] text-sage">
          Curated Discovery
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map((region, index) => {
          const imageUrl = region.heroImageUrl;
          return (
            <motion.button
              key={region.slug}
              type="button"
              onClick={() => router.push(`/city/${region.slug}`)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="group overflow-hidden rounded-2xl border border-sage/20 bg-white text-left shadow-sm transition-shadow hover:shadow-xl"
            >
              <div
                className="h-36 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
                aria-hidden="true"
              />
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif text-xl text-charcoal group-hover:text-sage">
                    {region.name}
                  </h3>
                  <span className="rounded-full bg-sage/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sage">
                    City
                  </span>
                </div>
                <p className="text-xs uppercase tracking-[0.14em] text-charcoal/65">
                  {region.country_code}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
