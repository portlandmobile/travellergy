import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const DEFAULT_DESCRIPTION =
  "Curated allergen intelligence for travelers — explore city-specific dining patterns, compare cities, and browse dishes with allergen context.";

/** Shared Open Graph / Twitter defaults; pages override `title` and `description`. */
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Travellergy — Allergen intelligence for travelers",
    template: "%s | Travellergy",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: "Travellergy",
  authors: [{ name: "Travellergy", url: SITE_URL }],
  creator: "Travellergy",
  keywords: [
    "food allergies",
    "travel dining",
    "allergens",
    "restaurant travel",
    "city food guide",
    "dish ingredients",
  ],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Travellergy",
    title: "Travellergy — Allergen intelligence for travelers",
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Travellergy — Allergen intelligence for travelers",
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};
