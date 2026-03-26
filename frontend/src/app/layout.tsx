import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RestroSathi - Your Restaurant's Digital Sathi",
  description: "QR-based restaurant ordering and management system",
  manifest: '/manifest.json', // Allows 'Add to Homescreen'
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "RestroSathi POS"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5", // Indigo-600 to match our brand
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
            {children}
            <Toaster position="top-right" />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
