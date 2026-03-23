import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 bg-white">
          <nav className="mx-auto w-full max-w-5xl px-6 py-4">
            <h1 className="text-xl font-semibold text-black">Travellergy</h1>
          </nav>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-1 px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
