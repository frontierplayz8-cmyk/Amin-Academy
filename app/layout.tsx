import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-noto-nastaliq-urdu",
  subsets: ["arabic"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Amin Academy | Digital Portal",
  description: "Advanced AI-powered archiving and digitization for academic past papers. Bridging the gap between traditional exams and digital learning.",
  icons: {
    icon: '/academy-logo.png'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${notoNastaliqUrdu.variable} antialiased scroll-smooth`}
      >
        <AuthProvider>
          <Toaster theme="dark" position="top-center" />
          <Navbar />
          {children}
        </AuthProvider>
        {/* <script src="https://accounts.google.com/gsi/client" async defer></script> */}
        {/* <script src="https://js.puter.com/v2/"></script> */}
      </body>
    </html>
  );
}
