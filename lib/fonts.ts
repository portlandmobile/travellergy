import { Fraunces } from "next/font/google";

/** Distinctive display serif for the Travellergy wordmark (header, hero). */
export const brandWordmark = Fraunces({
  subsets: ["latin"],
  variable: "--font-brand-wordmark",
  weight: ["700"],
});
