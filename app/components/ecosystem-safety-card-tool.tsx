"use client";

import { useState } from "react";
import { SAFETY_CARD_LOCALE_CODES } from "@/lib/supported-locales";

type DishOpt = { slug: string; name_en: string };

type CardPayload = {
  native_script_header: string;
  allergen_warning: string;
  safety_instructions: string[];
  disclaimer: string;
};

export function EcosystemSafetyCardTool({ dishes }: { dishes: DishOpt[] }) {
  const [dishSlug, setDishSlug] = useState(dishes[0]?.slug ?? "");
  const [locale, setLocale] = useState<string>(SAFETY_CARD_LOCALE_CODES[0]!);
  const [card, setCard] = useState<CardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!dishSlug) return;
    setLoading(true);
    setError("");
    setCard(null);
    try {
      const res = await fetch(
        `/api/v1/safety-cards/${encodeURIComponent(dishSlug)}/${encodeURIComponent(locale)}`,
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Could not load safety card.");
        return;
      }
      setCard((await res.json()) as CardPayload);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (dishes.length === 0) {
    return (
      <p className="text-sm text-charcoal/65">
        Add regional dishes to enable safety cards for this hub.
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-sage/20 bg-white p-4 shadow-sm">
      <h4 className="font-serif text-lg text-charcoal">Local safety card</h4>
      <p className="text-sm text-charcoal/65">
        Staff-facing text from DB templates for the selected language. Show on
        your phone at the venue.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-charcoal/80">
          Dish
          <select
            value={dishSlug}
            onChange={(e) => setDishSlug(e.target.value)}
            className="rounded-lg border border-sage/25 bg-white px-3 py-2 text-sm text-charcoal"
          >
            {dishes.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name_en}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-charcoal/80">
          Language
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="rounded-lg border border-sage/25 bg-white px-3 py-2 text-sm text-charcoal"
          >
            {SAFETY_CARD_LOCALE_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading || !dishSlug}
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage/90 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Generate card"}
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {card && (
        <div className="space-y-3 rounded-lg border border-sage/15 bg-warm/40 p-4 text-left">
          <p className="text-base font-semibold text-charcoal">
            {card.native_script_header}
          </p>
          <p className="text-sm leading-relaxed text-charcoal/90">
            {card.allergen_warning}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-charcoal/85">
            {card.safety_instructions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <p className="text-xs text-charcoal/55">{card.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
