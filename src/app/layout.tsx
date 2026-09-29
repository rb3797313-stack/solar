import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolarGuard AI — Industrial Solar PV Diagnostic & Root-Cause Engine",
  description:
    "AI + Physics Hybrid Solar PV Plant Monitoring & Root-Cause Diagnosis Platform for HACKVERSE '26 (CB-SW-07)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070c14] text-slate-100 antialiased min-h-screen scada-grid-bg selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
