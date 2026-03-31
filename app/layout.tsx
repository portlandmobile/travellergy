import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 bg-white">
          <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="text-xl font-semibold text-black">
              Travellergy
            </Link>
            <Link
              href="/compare"
              className="text-sm font-medium text-black underline-offset-4 hover:underline"
            >
              Compare
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/ingestion-review"
                className="text-sm font-medium text-black underline-offset-4 hover:underline"
              >
                Review
              </Link>
            ) : (
              <Link
                href="/admin/login?next=/admin/ingestion-review"
                className="text-sm font-medium text-black underline-offset-4 hover:underline"
              >
                Admin Login
              </Link>
            )}
          </nav>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-1 px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
