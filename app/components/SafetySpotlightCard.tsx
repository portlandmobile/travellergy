import Image from "next/image";
import Link from "next/link";
import { isSafetySpotlightVectorAsset } from "@/lib/safety-spotlight-assets";
import type { SafetySpotlightCategory } from "@/lib/safety-spotlights";

export type SafetySpotlightCardProps = {
  title: string;
  content: string;
  category: SafetySpotlightCategory;
  regionLabel: string;
  imageSrc: string;
  href: string;
};

function categoryBadgeClass(category: SafetySpotlightCategory): string {
  if (category === "Risk") {
    return "bg-travellergy-accent/12 text-charcoal ring-1 ring-travellergy-accent/35";
  }
  if (category === "Phrase") {
    return "bg-sage/12 text-sage ring-1 ring-sage/30";
  }
  return "bg-charcoal/[0.06] text-charcoal/80 ring-1 ring-charcoal/10";
}

function categoryLabel(category: SafetySpotlightCategory): string {
  if (category === "Risk") return "Risk intelligence";
  if (category === "Phrase") return "Phrase";
  return "Tip";
}

/**
 * Home discovery: safety intelligence (allergen warnings, regional context).
 * Shorter hero band than 16:9 so spotlights don’t dominate the viewport.
 */
export function SafetySpotlightCard({
  title,
  content,
  category,
  regionLabel,
  imageSrc,
  href,
}: SafetySpotlightCardProps) {
  return (
    <Link
      href={href}
      className="group block w-full overflow-hidden rounded-xl border border-sage/20 bg-white text-left shadow-sm transition-all duration-300 hover:border-sage/35 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
    >
      <div className="relative aspect-[5/1.35] w-full overflow-hidden bg-[#ebe4d8]">
        <Image
          src={imageSrc}
          alt={`${regionLabel}: ${title}`}
          fill
          unoptimized={isSafetySpotlightVectorAsset(imageSrc)}
          className="object-cover object-[center_38%] transition-transform duration-500 ease-out group-hover:scale-[1.01]"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-charcoal/[0.12] via-transparent to-transparent" />
        <div className="absolute top-1.5 left-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] shadow-sm backdrop-blur-sm ${categoryBadgeClass(category)}`}
          >
            {categoryLabel(category)}
          </span>
        </div>
      </div>
      <div className="space-y-1.5 px-4 pb-4 pt-2">
        <h3 className="font-serif text-lg leading-snug text-charcoal group-hover:text-sage">
          {title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-charcoal/70">
          {content}
        </p>
        <span className="inline-block text-xs font-semibold text-travellergy-accent underline-offset-4 group-hover:underline">
          View regional intelligence
        </span>
      </div>
    </Link>
  );
}
