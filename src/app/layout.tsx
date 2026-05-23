import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scriva",
  description:
    "A thinking workspace where your best ideas don't get lost in a chat thread.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0D9488",
        },
      }}
    >
      <html
        lang="en"
        className={`${inter.variable} ${lora.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="h-full overflow-hidden">
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
