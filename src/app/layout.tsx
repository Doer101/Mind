import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TempoInit } from "@/components/tempo-init";
import { ThemeProvider } from "@/components/theme-provider";
import { TempoScript } from "@/components/tempo-script";

const inter = Inter({ subsets: ["latin"] });

// Extend Window interface to include startTime
declare global {
  interface Window {
    startTime: number;
  }
}

export const metadata: Metadata = {
  title: "Quenalty - AI-Powered Mindfulness & Creativity",
  description:
    "Daily AI-generated mindfulness prompts and creative exercises for your mental wellness journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.startTime = ${Date.now()};`,
          }}
        />
      </head>
      <TempoScript />
      <body className={`${inter.className} bg-black/70 text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <TempoInit />
      </body>
    </html>
  );
}
