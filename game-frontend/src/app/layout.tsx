import "./globals.css";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import TxOverlay from "@/components/TxOverlay";
import { Toaster } from "react-hot-toast";

export const metadata = { title: "Expedition", description: "Portfolio DApp" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body id="top" className="min-h-screen flex flex-col">
        <div className="bg-adventure" />
        <AppHeader />
        <TxOverlay />
        <main className="mx-auto max-w-6xl px-4 py-6 flex-1">{children}</main>
        <Footer />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}