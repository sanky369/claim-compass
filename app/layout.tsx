import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "ClaimCompass — The Insurance Revenue Copilot for Therapists",
  description:
    "Decode denied therapy claims, get the next best action, and protect your practice revenue. EHR-agnostic. Built for solo and small-group behavioral health practices.",
  openGraph: {
    title: "ClaimCompass — The Insurance Revenue Copilot for Therapists",
    description:
      "Decode denied therapy claims, get the next best action, and protect your practice revenue.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
