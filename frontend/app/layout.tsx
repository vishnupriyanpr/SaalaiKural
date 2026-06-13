import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "சாலையின் குரல் TN — Gamified Road Damage Reporting",
  description: "Tamil Nadu State and District portal for gamified civilian road reporting, work allocation, AI classification, and rewards.",
  manifest: "/manifest.json",
  themeColor: "#FF6B2C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-200">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('Service Worker registered successfully:', reg.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}


