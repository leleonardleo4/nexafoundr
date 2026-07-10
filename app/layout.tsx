import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/use-toast";
import { SolanaProvider } from "@/components/solana/solana-provider";

export const metadata: Metadata = {
  title: "nexafoundr",
  description: "nexafoundr platform for founders, investors, and admins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SolanaProvider>
          {children}
          <Toaster />
        </SolanaProvider>
      </body>
    </html>
  );
}
