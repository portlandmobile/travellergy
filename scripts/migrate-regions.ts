import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const regions = [
  { slug: 'tokyo', name: 'Tokyo', country_code: 'JP', latitude: 35.6762, longitude: 139.6503 },
  { slug: 'bangkok', name: 'Bangkok', country_code: 'TH', latitude: 13.7563, longitude: 100.5018 },
  { slug: 'delhi', name: 'Delhi', country_code: 'IN', latitude: 28.6139, longitude: 77.2090 },
  { slug: 'nyc', name: 'New York City', country_code: 'US', latitude: 40.7128, longitude: -74.0060 }
];

async function migrate() {
  for (const region of regions) {
    console.log(`Inserting/Updating region: ${region.name}...`);
    
    // Using RPC or raw insert with ST_MakePoint for geography
    const { error } = await supabase.from('regions').insert({
      slug: region.slug,
      name: region.name,
      country_code: region.country_code,
      latitude: region.latitude,
      longitude: region.longitude,
      // We rely on PostGIS being enabled and the column type handling the conversion, 
      // or we can pass a PostGIS function via raw query if needed. 
      // Actually, standard Supabase insert with raw SQL is safer for ST_MakePoint.
    });

    if (error) {
        console.error(`Failed to insert ${region.name}:`, error.message);
    } else {
        console.log(`Inserted ${region.name}.`);
    }
  }
}

migrate();
