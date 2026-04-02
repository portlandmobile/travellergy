/**
 * Top allergens + sesame for filter UX. Keywords are heuristic matches on ingredient names.
 */
export const ALLERGEN_FILTERS = [
  { id: "shellfish", label: "Shellfish" },
  { id: "peanut", label: "Peanut" },
  { id: "tree_nut", label: "Tree nuts" },
  { id: "dairy", label: "Dairy" },
  { id: "egg", label: "Egg" },
  { id: "fish", label: "Fish" },
  { id: "soy", label: "Soy" },
  { id: "sesame", label: "Sesame" },
  { id: "gluten", label: "Gluten / wheat" },
] as const;

export type AllergenFilterId = (typeof ALLERGEN_FILTERS)[number]["id"];

const KEYWORD_TESTS: Record<AllergenFilterId, RegExp[]> = {
  shellfish: [
    /shrimp|prawn|crab|lobster|shellfish|crayfish|crawfish/i,
    /mussel|oyster|scallop|clam|squid|octopus|abalone/i,
  ],
  peanut: [/peanut/i],
  tree_nut: [
    /almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia/i,
    /tree nut|brazil nut|chestnut/i,
  ],
  dairy: [
    /milk|cream|butter|cheese|yogurt|yoghurt|dairy|lactose|whey|ghee/i,
  ],
  egg: [/egg|mayo|mayonnaise/i],
  fish: [/\bfish\b|anchovy|salmon|tuna|cod|mackerel|sardine|bass|trout|halibut/i],
  soy: [/soy|tofu|miso|edamame|tempeh|tamari/i],
  sesame: [/sesame|tahini/i],
  gluten: [
    /wheat|gluten|barley|rye|semolina|couscous|bulgur|farro/i,
    /\bflour\b|bread|pasta|noodle|cracker|breadcrumb/i,
  ],
};

export function allergenLabel(id: AllergenFilterId): string {
  return ALLERGEN_FILTERS.find((f) => f.id === id)?.label ?? id;
}

/** True if any ingredient name matches this allergen's keyword heuristics. */
export function ingredientBlobMatchesAllergen(
  ingredientNamesLower: string[],
  allergenId: AllergenFilterId,
): boolean {
  const blob = ingredientNamesLower.join(" ");
  const tests = KEYWORD_TESTS[allergenId];
  return tests.some((re) => re.test(blob));
}

/** Highlight segments in a line that match the active allergen (for display). */
export function findAllergenHighlightRanges(
  line: string,
  allergenId: AllergenFilterId,
): { start: number; end: number }[] {
  const tests = KEYWORD_TESTS[allergenId];
  const ranges: { start: number; end: number }[] = [];
  for (const re of tests) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
    while ((m = r.exec(line)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const cur of ranges) {
    const prev = merged[merged.length - 1];
    if (!prev || cur.start > prev.end) merged.push({ ...cur });
    else prev.end = Math.max(prev.end, cur.end);
  }
  return merged;
}
