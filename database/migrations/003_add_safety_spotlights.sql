-- Migration 003: Add Safety Spotlights Table

CREATE TABLE IF NOT EXISTS public.safety_spotlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Risk', 'Tip', 'Phrase')),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_safety_spotlights_region_slug ON public.safety_spotlights(region_slug);
CREATE INDEX IF NOT EXISTS idx_safety_spotlights_is_active ON public.safety_spotlights(is_active);
