import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { getI18n } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/provider";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return {
    title: {
      default: tr("Master's Snooker — Premier Snooker & Billiards Club"),
      template: "%s | Master's Snooker",
    },
    description: tr(
      "Master's Snooker club: championship tables, ranked matches, tournaments, live streams and a players' community. Book a table, climb the leaderboard.",
    ),
    keywords: ["snooker", "billiards", "club", "tournaments", "leaderboard"],
    openGraph: {
      title: "Master's Snooker",
      description: tr(
        "Championship tables, ranked matches, tournaments and live streams.",
      ),
      type: "website",
    },
  };
}

const themeInit = `
try {
  const t = localStorage.getItem("theme");
  if (t === "light") document.documentElement.classList.add("light");
} catch {}
`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { language, tr } = await getI18n();
  return (
    <html
      lang={language}
      dir={language === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${bebas.variable} ${manrope.variable} antialiased`}>
        <I18nProvider language={language}>
          <a href="#main-content" className="skip-link">
            {tr("Skip to content")}
          </a>
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
        </I18nProvider>
      </body>
    </html>
  );
}
