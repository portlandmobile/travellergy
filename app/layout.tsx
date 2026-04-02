import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
import { AllergenFilterProvider } from "@/app/contexts/allergen-filter-context";
import { clearAdminSessionCookie, isAdminAuthenticated } from "@/lib/admin-auth";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travellergy",
  description: "Travel allergen information by city and location.",
};

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
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-warm text-charcoal">
        <AllergenFilterProvider>
        <div className="flex min-h-full flex-col">
          <header className="border-b border-sage/15 bg-warm/95 backdrop-blur">
            <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
              <Link href="/" className="font-serif text-3xl font-semibold text-charcoal">
                Travellergy
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  href="/compare"
                  className="rounded-full border border-sage/50 bg-sage/8 px-4 py-2 text-sm font-semibold text-sage transition-colors hover:bg-sage/15"
                >
                  Compare
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin/ingestion-review"
                    className="text-sm font-medium text-charcoal/80 underline-offset-4 hover:underline"
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
              <p className="text-xs text-charcoal/55">
                Curated allergen intelligence for travelers.
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
