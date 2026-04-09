import { JsonLd } from "@/app/components/json-ld";
import { SITE_URL } from "@/lib/site";

export type BreadcrumbItem = { name: string; path: string };

type Props = { items: BreadcrumbItem[] };

export function BreadcrumbJsonLd({ items }: Props) {
  if (items.length === 0) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };

  return <JsonLd data={data} />;
}
