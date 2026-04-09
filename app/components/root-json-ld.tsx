import { JsonLd } from "@/app/components/json-ld";
import { SITE_URL } from "@/lib/site";

const DESCRIPTION =
  "Curated allergen intelligence for travelers — explore city-specific dining patterns and dishes with confidence.";

export function RootJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Travellergy",
    url: SITE_URL,
    description: DESCRIPTION,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Travellergy",
    url: SITE_URL,
    description: DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: "Travellergy",
      url: SITE_URL,
    },
  };

  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={website} />
    </>
  );
}
