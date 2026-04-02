"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ingredientBlobMatchesAllergen,
  type AllergenFilterId,
} from "@/lib/allergen-taxonomy";
import type { RegionDishCard } from "@/lib/regions-dishes";
import { useAllergenFilter } from "@/app/contexts/allergen-filter-context";
import { AllergenFilterPillBar } from "@/app/components/allergen-filter-pill-bar";
import { SafetyIndicator } from "@/app/components/safety-indicator";

type Props = {
  citySlug: string;
  dishes: RegionDishCard[];
};

function dishMatchesFilter(
  dish: RegionDishCard,
  filter: AllergenFilterId | null,
): boolean {
  if (filter === null) return true;
  const lower = dish.ingredient_names.map((n) => n.toLowerCase());
  return ingredientBlobMatchesAllergen(lower, filter);
}

export default function CityHubClient({ citySlug, dishes }: Props) {
  const { selectedAllergen } = useAllergenFilter();
  const visible = dishes.filter((d) => dishMatchesFilter(d, selectedAllergen));

  return (
    <div className="relative pb-28">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl text-charcoal">
              Top culinary patterns
            </h3>
            <p className="mt-1 text-sm text-charcoal/60">
              {selectedAllergen === null
                ? "Tap a filter to focus on dishes that may include that allergen."
                : `Showing dishes whose ingredients may include this allergen (${visible.length} of ${dishes.length}).`}
            </p>
          </div>
        </div>

        {dishes.length === 0 ? (
          <p className="text-sm text-charcoal/65">
            No data available for this city yet.
          </p>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border border-sage/20 bg-white/60 px-4 py-6 text-sm text-charcoal/70">
            No dishes match this filter for ingredient names we have on file.
            Clear the filter or check dish pages for full ingredient lists.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {visible.map((dish, index) => (
              <motion.li
                key={dish.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.04 * index }}
              >
                <Link
                  href={`/dishes/${dish.slug}?from=${encodeURIComponent(citySlug)}`}
                  className="group block h-full rounded-2xl border border-sage/20 bg-white p-4 shadow-sm transition-all hover:border-sage/35 hover:shadow-md"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="flex h-full flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-lg text-charcoal group-hover:text-sage">
                        {dish.name_en}
                      </h4>
                      <SafetyIndicator riskLevel={dish.risk_level} />
                    </div>
                    <p className="text-xs uppercase tracking-[0.14em] text-charcoal/55">
                      {dish.prevalence.charAt(0) +
                        dish.prevalence.slice(1).toLowerCase()}{" "}
                      prevalence
                    </p>
                    <span className="mt-auto inline-flex text-sm font-semibold text-travellergy-accent underline-offset-4 group-hover:underline">
                      View dish
                    </span>
                  </motion.div>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <AllergenFilterPillBar />
    </div>
  );
}
