import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
import { AllergenFilterProvider } from "@/app/contexts/allergen-filter-context";
import { MixpanelAnalytics } from "@/app/components/mixpanel-analytics";
import { RootJsonLd } from "@/app/components/root-json-ld";
import { clearAdminSessionCookie, isAdminAuthenticated } from "@/lib/admin-auth";
import { brandWordmark } from "@/lib/fonts";
import { rootMetadata } from "@/lib/seo-metadata";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = rootMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdmin = await isAdminAuthenticated();

  async function logoutAction() {
    "use server";
    await clearAdminSessionCookie();
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${brandWordmark.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-warm text-charcoal">
        <RootJsonLd />
        <MixpanelAnalytics />
        <AllergenFilterProvider>
        <div className="flex min-h-full flex-col">
          <header className="relative overflow-hidden border-b border-sage/20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-top bg-repeat-x bg-[length:auto_100%]"
              style={{
                backgroundImage:
                  "url('/travellergy-header-background.png')",
              }}
            />
            {/* Light wash only on the left so the artwork stays visible on the right */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-warm/50 from-0% via-warm/15 via-[45%] to-transparent to-[70%]"
            />
            <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0 flex-1">
                <Link
                  href="/"
                  className={`${brandWordmark.className} group inline-block text-[1.65rem] font-bold leading-none tracking-[-0.04em] text-sage sm:text-4xl [text-shadow:0_0_20px_rgb(253,251,246),0_1px_0_rgb(253,251,246)] transition-colors hover:text-sage/90`}
                >
                  <span className="relative">
                    Travellergy
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-travellergy-accent/80 via-travellergy-accent to-travellergy-accent/80 opacity-90 transition-opacity group-hover:opacity-100"
                    />
                  </span>
                </Link>
                <p className="mt-1 max-w-md text-xs leading-snug text-charcoal/85 [text-shadow:0_0_18px_rgb(253,251,246),0_1px_1px_rgb(253,251,246)] sm:text-[13px]">
                  Curated allergen intelligence for travelers.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/compare"
                  className="rounded-full border border-sage/40 bg-white/70 px-4 py-2 text-sm font-semibold text-sage shadow-sm backdrop-blur-[1px] transition-colors hover:bg-white/90"
                >
                  Compare
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin/ingestion-review"
                    className="text-sm font-medium text-charcoal [text-shadow:0_0_14px_rgb(253,251,246)] underline-offset-4 hover:underline"
                  >
                    Review
                  </Link>
                ) : null}
              </div>
            </nav>
          </header>
          <main className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-10">
            {children}
          </main>
          <footer className="border-t border-sage/15 bg-warm/80">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <p className="text-xs text-charcoal/45">
                © {new Date().getFullYear()} Travellergy
              </p>
              {!isAdmin ? (
                <Link
                  href="/admin/login?next=/admin/ingestion-review"
                  className="text-xs font-medium text-charcoal/70 underline-offset-4 hover:underline"
                >
                  Admin Login
                </Link>
              ) : (
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="text-xs font-medium text-charcoal/70 underline-offset-4 hover:underline"
                  >
                    Admin Logout
                  </button>
                </form>
              )}
            </div>
          </footer>
        </div>
        </AllergenFilterProvider>
      </body>
    </html>
  );
}
