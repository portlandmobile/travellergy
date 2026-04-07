-- 007: Anchor regions for China / Africa culinary ecosystem ingest (CHINA_AFRICA_INGEST.json).
-- Idempotent: ON CONFLICT (slug) DO NOTHING.

INSERT INTO public.regions (slug, name, country_code, is_active, latitude, longitude, geo) VALUES
    ('shanghai', 'Shanghai', 'CN', true, 31.230400, 121.473700, ST_SetSRID(ST_MakePoint(121.473700, 31.230400), 4326)),
    ('beijing', 'Beijing', 'CN', true, 39.904200, 116.407400, ST_SetSRID(ST_MakePoint(116.407400, 39.904200), 4326)),
    ('chongqing', 'Chongqing', 'CN', true, 29.431600, 106.912300, ST_SetSRID(ST_MakePoint(106.912300, 29.431600), 4326)),
    ('guangzhou', 'Guangzhou', 'CN', true, 23.129100, 113.264400, ST_SetSRID(ST_MakePoint(113.264400, 23.129100), 4326)),
    ('marrakech', 'Marrakech', 'MA', true, 31.629500, -7.981100, ST_SetSRID(ST_MakePoint(-7.981100, 31.629500), 4326)),
    ('addis-ababa', 'Addis Ababa', 'ET', true, 9.032000, 38.746900, ST_SetSRID(ST_MakePoint(38.746900, 9.032000), 4326))
ON CONFLICT (slug) DO NOTHING;
