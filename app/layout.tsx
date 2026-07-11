import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/use-toast";
import { SolanaProvider } from "@/components/solana/solana-provider";

export const metadata: Metadata = {
  title: "NexaFoundr",
  description: "NexaFoundr connects verified founders and investors through private chat, escrow-backed funding, and premium dashboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <SolanaProvider>
          {children}
          <Toaster />
        </SolanaProvider>
      </body>
    </html>
  );
}
