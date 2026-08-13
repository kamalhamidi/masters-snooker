import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: {
    default: "Master's Snooker — Premier Snooker & Billiards Club",
    template: "%s | Master's Snooker",
  },
  description:
    "Master's Snooker club: championship tables, ranked matches, tournaments, live streams and a players' community. Book a table, climb the leaderboard.",
  keywords: ["snooker", "billiards", "club", "tournaments", "leaderboard"],
  openGraph: {
    title: "Master's Snooker",
    description: "Championship tables, ranked matches, tournaments and live streams.",
    type: "website",
  },
};

const themeInit = `
try {
  const t = localStorage.getItem("theme");
  if (t === "light") document.documentElement.classList.add("light");
} catch {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${bebas.variable} ${manrope.variable} antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            },
          }}
        />
      </body>
    </html>
  );
}
