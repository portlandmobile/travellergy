import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const regions = [
  { slug: 'paris', name: 'Paris', country_code: 'FR', is_active: true, lat: 48.8566, lon: 2.3522 },
  { slug: 'lyon', name: 'Lyon', country_code: 'FR', is_active: false, lat: 45.7640, lon: 4.8357 },
  { slug: 'marseille', name: 'Marseille', country_code: 'FR', is_active: false, lat: 43.2965, lon: 5.3698 },
  { slug: 'bordeaux', name: 'Bordeaux', country_code: 'FR', is_active: false, lat: 44.8378, lon: -0.5792 },
  { slug: 'nice', name: 'Nice', country_code: 'FR', is_active: false, lat: 43.7102, lon: 7.2620 },
  { slug: 'toulouse', name: 'Toulouse', country_code: 'FR', is_active: false, lat: 43.6047, lon: 1.4442 },
  { slug: 'lille', name: 'Lille', country_code: 'FR', is_active: false, lat: 50.6292, lon: 3.0573 },
  { slug: 'nantes', name: 'Nantes', country_code: 'FR', is_active: false, lat: 47.2184, lon: -1.5536 },
  { slug: 'strasbourg', name: 'Strasbourg', country_code: 'FR', is_active: false, lat: 48.5734, lon: 7.7521 },
  { slug: 'montpellier', name: 'Montpellier', country_code: 'FR', is_active: false, lat: 43.6108, lon: 3.8767 },
  { slug: 'rome', name: 'Rome', country_code: 'IT', is_active: true, lat: 41.9028, lon: 12.4964 },
  { slug: 'milan', name: 'Milan', country_code: 'IT', is_active: false, lat: 45.4642, lon: 9.1900 },
  { slug: 'naples', name: 'Naples', country_code: 'IT', is_active: false, lat: 40.8518, lon: 14.2681 },
  { slug: 'turin', name: 'Turin', country_code: 'IT', is_active: false, lat: 45.0703, lon: 7.6869 },
  { slug: 'florence', name: 'Florence', country_code: 'IT', is_active: false, lat: 43.7696, lon: 11.2558 },
  { slug: 'bologna', name: 'Bologna', country_code: 'IT', is_active: false, lat: 44.4949, lon: 11.3426 },
  { slug: 'verona', name: 'Verona', country_code: 'IT', is_active: false, lat: 45.4384, lon: 10.9916 },
  { slug: 'venice', name: 'Venice', country_code: 'IT', is_active: false, lat: 45.4408, lon: 12.3155 },
  { slug: 'genoa', name: 'Genoa', country_code: 'IT', is_active: false, lat: 44.4056, lon: 8.9463 },
  { slug: 'palermo', name: 'Palermo', country_code: 'IT', is_active: false, lat: 38.1157, lon: 13.3615 },
  { slug: 'barcelona', name: 'Barcelona', country_code: 'ES', is_active: true, lat: 41.3851, lon: 2.1734 },
  { slug: 'madrid', name: 'Madrid', country_code: 'ES', is_active: false, lat: 40.4168, lon: -3.7038 },
  { slug: 'valencia', name: 'Valencia', country_code: 'ES', is_active: false, lat: 39.4699, lon: -0.3763 },
  { slug: 'seville', name: 'Seville', country_code: 'ES', is_active: false, lat: 37.3891, lon: -5.9845 },
  { slug: 'zaragoza', name: 'Zaragoza', country_code: 'ES', is_active: false, lat: 41.6488, lon: -0.8891 },
  { slug: 'malaga', name: 'Malaga', country_code: 'ES', is_active: false, lat: 36.7213, lon: -4.4214 },
  { slug: 'bilbao', name: 'Bilbao', country_code: 'ES', is_active: false, lat: 43.2630, lon: -2.9350 },
  { slug: 'palma', name: 'Palma', country_code: 'ES', is_active: false, lat: 39.5696, lon: 2.6502 },
  { slug: 'las-palmas', name: 'Las Palmas', country_code: 'ES', is_active: false, lat: 28.1235, lon: -15.4363 },
  { slug: 'alicante', name: 'Alicante', country_code: 'ES', is_active: false, lat: 38.3452, lon: -0.4815 },
  { slug: 'berlin', name: 'Berlin', country_code: 'DE', is_active: true, lat: 52.5200, lon: 13.4050 },
  { slug: 'hamburg', name: 'Hamburg', country_code: 'DE', is_active: false, lat: 53.5511, lon: 9.9937 },
  { slug: 'munich', name: 'Munich', country_code: 'DE', is_active: false, lat: 48.1351, lon: 11.5820 },
  { slug: 'cologne', name: 'Cologne', country_code: 'DE', is_active: false, lat: 50.9375, lon: 6.9603 },
  { slug: 'frankfurt', name: 'Frankfurt', country_code: 'DE', is_active: false, lat: 50.1109, lon: 8.6821 },
  { slug: 'stuttgart', name: 'Stuttgart', country_code: 'DE', is_active: false, lat: 48.7758, lon: 9.1829 },
  { slug: 'duesseldorf', name: 'Düsseldorf', country_code: 'DE', is_active: false, lat: 51.2277, lon: 6.7735 },
  { slug: 'dortmund', name: 'Dortmund', country_code: 'DE', is_active: false, lat: 51.5136, lon: 7.4653 },
  { slug: 'essen', name: 'Essen', country_code: 'DE', is_active: false, lat: 51.4556, lon: 7.0116 },
  { slug: 'leipzig', name: 'Leipzig', country_code: 'DE', is_active: false, lat: 51.3397, lon: 12.3731 }
];

async function migrate() {
    for (const region of regions) {
        console.log(`Upserting region: ${region.name}...`);
        const { error } = await supabase.from('regions').upsert({
            slug: region.slug,
            name: region.name,
            country_code: region.country_code,
            is_active: region.is_active,
            latitude: region.lat,
            longitude: region.lon,
            geo: `SRID=4326;POINT(${region.lon} ${region.lat})`
        }, { onConflict: 'slug' });
        
        if (error) console.error(`Failed ${region.name}:`, error.message);
    }
}

migrate();
