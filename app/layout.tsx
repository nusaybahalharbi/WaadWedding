import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "وعد & محمد | Waad & Mohammed",
  description: "مشاركة لحظات الفرح",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  other: {
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="googlebot" content="noindex, nofollow, noarchive" />
      </head>
      <body className="min-h-screen bg-wedding-cream">{children}</body>
    </html>
  );
}
