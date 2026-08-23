import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/use-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { PrivyAppProviders } from "@/components/providers/privy-app-providers";

export const metadata: Metadata = {
  title: "NexaFoundr",
  description: "NexaFoundr connects verified founders and investors through private chat, escrow-backed funding, and premium dashboards.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090f1f" },
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[color:var(--background)] text-[color:var(--foreground)]">
        <ThemeProvider>
          <PrivyAppProviders>
            {children}
            <Toaster />
          </PrivyAppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
