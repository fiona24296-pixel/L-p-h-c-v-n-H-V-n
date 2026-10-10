"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthProvider";
import { BottomNav } from "./BottomNav";
import { DataProvider } from "./DataProvider";
import { LoginScreen } from "./LoginScreen";
import { Spinner } from "./ui";

function Gate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  if (state.status === "loading") return <Spinner label="Đang mở app…" />;
  if (state.status !== "ready") return <LoginScreen />;
  return (
    <DataProvider>
      <div className="mx-auto min-h-dvh max-w-lg pb-24">{children}</div>
      <BottomNav />
    </DataProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
