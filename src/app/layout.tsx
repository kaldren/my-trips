import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import { cn } from "@/lib/utils";

import "./globals.css";

// Nunito: rounded, friendly, highly legible. One variable family for
// headings and body; see DESIGN.md "Typography".
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: { default: "My Trips", template: "%s · My Trips" },
  description: "Track your trips and the places you visit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", nunito.variable)}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
