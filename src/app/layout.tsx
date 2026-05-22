import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

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
        baseTheme: dark,
        variables: {
          colorPrimary: "#0D9488",
          colorBackground: "#0E1117",
          colorInputBackground: "#131820",
          colorText: "#E2E8F0",
        },
      }}
    >
      <html
        lang="en"
        className={`${inter.variable} ${lora.variable} dark h-full antialiased`}
      >
        <body className="h-full overflow-hidden">{children}</body>
      </html>
    </ClerkProvider>
  );
}
