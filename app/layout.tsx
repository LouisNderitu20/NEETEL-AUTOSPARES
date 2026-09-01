import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "NEETEL AUTOSPARES — Garage & Parts Management System",
    template: "%s | NEETEL AUTOSPARES",
  },
  description:
    "Professional car garage and spare parts management system. Manage job cards, inventory, POS billing, employees, and reports — all in one place.",
  keywords: ["garage management", "spare parts", "job card", "automotive", "POS"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={manrope.variable}>
      <body className={manrope.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
