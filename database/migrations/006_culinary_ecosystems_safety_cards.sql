-- 006: Culinary ecosystems (China/Africa pivot), safety card templates, v1 locales.
-- Backward compatible: additive only; existing regions/dishes unchanged.

CREATE TABLE IF NOT EXISTS public.supported_locales (
    code TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    native_label TEXT,
    is_rtl BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.culinary_ecosystems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_local TEXT,
    description TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_culinary_ecosystems_slug ON public.culinary_ecosystems (slug);

CREATE TABLE IF NOT EXISTS public.region_culinary_ecosystem (
    region_id UUID NOT NULL REFERENCES public.regions (id) ON DELETE CASCADE,
    ecosystem_id UUID NOT NULL REFERENCES public.culinary_ecosystems (id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (region_id, ecosystem_id)
);

CREATE INDEX IF NOT EXISTS idx_rce_region ON public.region_culinary_ecosystem (region_id);
CREATE INDEX IF NOT EXISTS idx_rce_ecosystem ON public.region_culinary_ecosystem (ecosystem_id);

CREATE TABLE IF NOT EXISTS public.safety_card_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locale_code TEXT NOT NULL REFERENCES public.supported_locales (code) ON DELETE CASCADE,
    native_script_header_template TEXT NOT NULL,
    allergen_warning_template TEXT NOT NULL,
    safety_instructions_templates JSONB NOT NULL DEFAULT '[]'::jsonb,
    disclaimer_template TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (locale_code)
);

-- v1 fixed locales
INSERT INTO public.supported_locales (code, name_en, native_label, is_rtl) VALUES
    ('en', 'English', 'English', false),
    ('zh-hans', 'Chinese (Simplified)', '简体中文', false),
    ('th', 'Thai', 'ไทย', false),
    ('sw', 'Swahili', 'Kiswahili', false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.safety_card_templates (
    locale_code,
    native_script_header_template,
    allergen_warning_template,
    safety_instructions_templates,
    disclaimer_template
) VALUES
(
    'en',
    'Allergy notice — {{dish_name_en}}',
    'I have a severe food allergy. This dish may contain: {{allergen_summary}}. Cross-contact from shared equipment or cooking oils may still be a risk.',
    '["Please ask kitchen staff to confirm ingredients.","If they cannot confirm, I should not eat this dish."]'::jsonb,
    'This card is guidance only. Always verify with the venue.'
),
(
    'zh-hans',
    '过敏提示 — {{dish_name_local}}',
    '我有严重食物过敏。本菜可能含有：{{allergen_summary}}。请向厨房确认配料及共用厨具、油脂的交叉接触风险。',
    '["请厨房书面或口头确认配料。","如无法确认，我不应食用此菜。"]'::jsonb,
    '此卡片仅供参考，请务必向餐厅核实。'
),
(
    'th',
    'แจ้งแพ้อาหาร — {{dish_name_local}}',
    'ฉันมีอาการแพ้อาหารรุนแรง อาหารจานนี้อาจมี: {{allergen_summary}} กรุณาให้ครัวยืนยันและระวังการปนเปื้อนจากกระทะ/น้ำมันร่วม',
    '["กรุณาให้ครัวยืนยันวัตถุดิบ","หากไม่แน่ใจ ฉันไม่ควรรับประทาน"]'::jsonb,
    'ข้อความนี้เป็นคำแนะนำเท่านั้น โปรดยืนยันกับร้านอาหาร'
),
(
    'sw',
    'Noti ya mzio — {{dish_name_en}}',
    'Nina mzio mkali wa chakula. Chakula hiki kinaweza kuwa na: {{allergen_summary}}. Tafadhali thibitisha na jikini kuhusu kuchanganywa kwa vyombo na mafuta.',
    '["Thibitisha viungo na wapishi.","Ikiwa hakuna uhakika, sipaswi kula."]'::jsonb,
    'Hii ni mwongozo tu; thibitisha na mgahawa.'
)
ON CONFLICT (locale_code) DO UPDATE SET
    native_script_header_template = EXCLUDED.native_script_header_template,
    allergen_warning_template = EXCLUDED.allergen_warning_template,
    safety_instructions_templates = EXCLUDED.safety_instructions_templates,
    disclaimer_template = EXCLUDED.disclaimer_template,
    updated_at = NOW();

-- Sample hubs (expand via data pipeline later)
INSERT INTO public.culinary_ecosystems (slug, name_en, name_local, description, seo_description) VALUES
(
    'edo-mae-sushi',
    'Edo-mae sushi',
    '江戸前寿司',
    'Tokyo-style sushi: cured fish, shari, and Edo-period techniques. Soy, egg, shellfish, and fish appear in sides, sauces, and dashi.',
    'Allergen intelligence for Edo-mae sushi in Tokyo — fish, shellfish, egg, soy, sesame, and cross-contact in compact kitchens.'
),
(
    'isaan-street',
    'Isaan & central Thai street food',
    'อาหารอีสาน / สตรีท',
    'Grilled meats, som tam, fish sauce, shrimp paste, and peanuts in dips; shared grills and mortars increase cross-contact risk.',
    'Street-food allergen patterns for Bangkok — seafood sauces, peanuts, eggs, dairy in sweets, and shared equipment.'
)
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_local = EXCLUDED.name_local,
    description = EXCLUDED.description,
    seo_description = EXCLUDED.seo_description,
    updated_at = NOW();

INSERT INTO public.region_culinary_ecosystem (region_id, ecosystem_id, sort_order, is_primary)
SELECT r.id, e.id, 0, true
FROM public.regions r
JOIN public.culinary_ecosystems e ON e.slug = 'edo-mae-sushi'
WHERE r.slug = 'tokyo'
ON CONFLICT DO NOTHING;

INSERT INTO public.region_culinary_ecosystem (region_id, ecosystem_id, sort_order, is_primary)
SELECT r.id, e.id, 0, true
FROM public.regions r
JOIN public.culinary_ecosystems e ON e.slug = 'isaan-street'
WHERE r.slug = 'bangkok'
ON CONFLICT DO NOTHING;
