import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://customer-feedback-router.app"),
  title: {
    default: "Customer Feedback Router",
    template: "%s | Customer Feedback Router"
  },
  description:
    "AI-powered customer feedback routing for customer success and product teams. Classify feedback, enforce routing rules, and assign owners automatically.",
  keywords: [
    "customer feedback routing",
    "customer success automation",
    "feedback triage",
    "support workflow",
    "product insights"
  ],
  openGraph: {
    title: "Customer Feedback Router",
    description:
      "Route customer feedback to the right teammate in seconds with AI classification and flexible routing rules.",
    url: "https://customer-feedback-router.app",
    siteName: "Customer Feedback Router",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Customer Feedback Router dashboard preview"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Customer Feedback Router",
    description:
      "AI-powered routing for support, product, and customer success feedback queues.",
    images: ["/og-image.svg"]
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} bg-[#0d1117] text-[var(--text-primary)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
