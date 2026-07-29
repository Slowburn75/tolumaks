"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { useAuthStore } from "@/hooks/useAuth";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, isAuthenticated, getMe } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function guard() {
      if (!token) {
        router.replace("/login?redirect=/admin");
        return;
      }
      let current = user;
      if (!current) {
        await getMe();
        current = useAuthStore.getState().user;
      }
      if (cancelled) return;
      if (!current || current.role !== "ADMIN") {
        router.replace("/");
        return;
      }
      setReady(true);
    }

    guard();
    return () => {
      cancelled = true;
    };
  }, [token, user, isAuthenticated, getMe, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 mt-16 ml-0 lg:ml-64">{children}</main>
      </div>
    </div>
  );
}
