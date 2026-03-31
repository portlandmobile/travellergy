
-- Migration: Add target cities to public.regions
-- Run this in Supabase SQL Editor.

insert into public.regions (slug, name, country_code, latitude, longitude, geo)
values 
    ('tokyo', 'Tokyo', 'JP', 35.6762, 139.6503, st_setsrid(st_makepoint(139.6503, 35.6762), 4326)::geography),
    ('bangkok', 'Bangkok', 'TH', 13.7563, 100.5018, st_setsrid(st_makepoint(100.5018, 13.7563), 4326)::geography),
    ('delhi', 'Delhi', 'IN', 28.6139, 77.2090, st_setsrid(st_makepoint(77.2090, 28.6139), 4326)::geography),
    ('nyc', 'New York City', 'US', 40.7128, -74.0060, st_setsrid(st_makepoint(-74.0060, 40.7128), 4326)::geography)
on conflict (slug) do nothing;
