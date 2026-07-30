import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const ogImage = `${protocol}://${host}/og.png`;
  const title = "无尽冬日 3760 区欢迎你";
  const description =
    "无尽冬日国服 3760 区：王国进程、事件计时、移民分组与小榜制度。";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        { url: ogImage, width: 1731, height: 909, alt: "3760 区 · 无尽冬日" },
      ],
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='zh-CN' className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
