import type { Metadata } from "next";
import { Open_Sans, Noto_Sans_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { UserSettingsProvider } from "@/context/UserSettingsContext";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

const notoMono = Noto_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Releasly — Release Management",
  description: "Internes Release-Management-Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" data-theme="light" data-density="default" className={`${openSans.variable} ${notoMono.variable}`}>
      <body>
        <SessionProvider>
          <UserSettingsProvider>{children}</UserSettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
