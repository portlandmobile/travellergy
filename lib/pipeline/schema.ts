import { z } from "zod";

/** Matches API / ingestion ingredient line shape (allergen risk filled in later in production). */
export const DishIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name required"),
  is_hidden: z.boolean().optional().default(false),
  allergen_risk: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]).optional(),
});

export type DishIngredient = z.infer<typeof DishIngredientSchema>;

/** Ontology-aligned dish payload for staging -> production merge. */
export const DishSchema = z.object({
  name_local: z.string().min(1),
  name_en: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "slug must be lowercase alphanumeric with single hyphens",
    ),
  description: z.string().optional().default(""),
  is_common_allergen_risk: z.boolean().optional().default(false),
  risk_level: z.enum(["safe", "caution", "high-risk"]).default("safe"),
  safety_tips: z.array(z.string()).default([]),
  ingredients: z.array(DishIngredientSchema).default([]),
});

export type Dish = z.infer<typeof DishSchema>;

/** Provenance for a single ingestion attempt (stored alongside raw JSON). */
export const IngestionSourceSchema = z.object({
  source_name: z.string().min(1),
  source_api_version: z.string().optional(),
  external_id: z.string().optional(),
  external_uri: z.string().optional(),
  fetched_at: z.string().optional(),
});

export type IngestionSource = z.infer<typeof IngestionSourceSchema>;
