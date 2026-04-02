-- Migration 005: Global Intelligence Refactor

-- 1. Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('region', 'dish', 'ingredient')),
    entity_id UUID NOT NULL,
    locale TEXT NOT NULL,
    field TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, locale, field)
);

CREATE INDEX IF NOT EXISTS idx_translations_lookup ON public.translations(entity_type, entity_id, locale);

-- 2. Update regions table for hierarchy
ALTER TABLE public.regions 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.regions(id),
ADD COLUMN IF NOT EXISTS region_type TEXT DEFAULT 'city' CHECK (region_type IN ('continent', 'country', 'city', 'cuisine_group'));

-- 3. Data Migration (Optional/Manual):
-- Populate translations from existing regions.name if desired, 
-- but we'll start with fresh translations for the new locales.
