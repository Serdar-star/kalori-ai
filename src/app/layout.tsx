import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { AppProvider } from "@/lib/store";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kalora — AI Calorie & Nutrition Tracker",
  description:
    "Snap a photo of your meal and let AI count the calories and macros. Streaks, insights and a coach that keeps you on track.",
  applicationName: "Kalora",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kalora",
  },
  icons: [
    { rel: "icon", type: "image/svg+xml", url: "/favicon.svg" },
    { rel: "apple-touch-icon", url: "/icon-512.png" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#0b0e09",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${sora.variable} ${manrope.variable} ambient min-h-dvh antialiased`}>
        <AppProvider>
          <AuthProvider>{children}</AuthProvider>
        </AppProvider>
      </body>
    </html>
  );
}
