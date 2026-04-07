"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FeaturedRegion } from "@/lib/featured-regions";

const ROTATE_MS = 6500;

type Props = {
  setA: FeaturedRegion[];
  setB: FeaturedRegion[];
};

function CityCardButton({
  region,
  index,
  onNavigate,
}: {
  region: FeaturedRegion;
  index: number;
  onNavigate: (slug: string) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onNavigate(region.slug)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.04 * index }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group overflow-hidden rounded-2xl border border-sage/20 bg-white text-left shadow-sm transition-shadow hover:shadow-xl"
    >
      <div
        className="h-36 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${region.heroImageUrl})` }}
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
}

export default function FeaturedCityGrid({ setA, setB }: Props) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pauseRef = useRef(false);

  const useCarousel = setB.length > 0;
  const activeRegions = useCarousel
    ? activeIndex === 0
      ? setA
      : setB
    : setA;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!useCarousel || reduceMotion) return;
    const id = window.setInterval(() => {
      if (pauseRef.current) return;
      setActiveIndex((i) => (i + 1) % 2);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [useCarousel, reduceMotion]);

  const goTo = (i: number) => setActiveIndex(i);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="space-y-4"
      aria-roledescription={useCarousel ? "carousel" : undefined}
      aria-label="Featured cities"
      onMouseEnter={() => {
        pauseRef.current = true;
      }}
      onMouseLeave={() => {
        pauseRef.current = false;
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-charcoal">Featured Cities</h2>
        <div className="flex items-center gap-3">
          {useCarousel && !reduceMotion ? (
            <span className="text-xs uppercase tracking-[0.18em] text-sage">
              Rotating discovery
            </span>
          ) : (
            <span className="text-xs uppercase tracking-[0.18em] text-sage">
              Curated Discovery
            </span>
          )}
          {useCarousel ? (
            <div
              className="flex gap-1.5"
              role="tablist"
              aria-label="Featured city sets"
            >
              {[0, 1].map((i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={activeIndex === i}
                  aria-label={`Show city set ${i + 1} of 2`}
                  onClick={() => goTo(i)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    activeIndex === i
                      ? "bg-sage"
                      : "bg-sage/25 hover:bg-sage/45"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative min-h-[280px] sm:min-h-[320px]">
        {useCarousel && !reduceMotion ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeIndex}
              role="tabpanel"
              aria-label={`Set ${activeIndex + 1} of 2`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {activeRegions.map((region, index) => (
                <CityCardButton
                  key={region.slug}
                  region={region}
                  index={index}
                  onNavigate={(slug) => router.push(`/city/${slug}`)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeRegions.map((region, index) => (
              <CityCardButton
                key={region.slug}
                region={region}
                index={index}
                onNavigate={(slug) => router.push(`/city/${slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
