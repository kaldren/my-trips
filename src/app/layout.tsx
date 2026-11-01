import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import { themeScript } from "@/lib/theme/theme";
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
    // The theme script sets `class="dark"` and color-scheme before hydration.
    <html lang="en" className={cn("font-sans", nunito.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
