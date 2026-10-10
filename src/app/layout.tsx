import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lớp Văn Cô Hạ Vân",
  description: "Điểm danh, nhận xét, học phí lớp Văn cô Hạ Vân",
  applicationName: "Lớp Văn",
  appleWebApp: { capable: true, title: "Lớp Văn", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/favicon-48.png", sizes: "48x48", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
