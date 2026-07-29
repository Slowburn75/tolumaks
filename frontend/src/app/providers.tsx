"use client";

import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { SiteSettingsProvider } from "@/providers/SiteSettingsProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <SiteSettingsProvider>
          <ToastProvider />
          {children}
        </SiteSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
