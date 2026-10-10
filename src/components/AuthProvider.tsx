"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FIREBASE_CONFIGURED, getDb, getFirebaseAuth, USE_EMULATOR } from "@/lib/firebase";

type AuthState =
  | { status: "loading" }
  | { status: "signed-out"; error?: string }
  | { status: "denied"; email: string }
  | { status: "ready"; user: User };

interface AuthContextValue {
  state: AuthState;
  signIn: () => Promise<void>;
  signInDemo: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải nằm trong AuthProvider");
  return ctx;
}

/**
 * Kiểm tra quyền bằng cách đọc thử 1 document: Security Rules chỉ cho email của cô,
 * nên email khác sẽ bị từ chối ngay tại máy chủ. Không cần ghi email vào code.
 */
async function hasAccess(): Promise<boolean | "offline"> {
  try {
    await getDocFromServer(doc(getDb(), "settings", "main"));
    return true;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "permission-denied") return false;
    return "offline"; // mất mạng: vẫn cho vào, dữ liệu đệm trên máy cũng chỉ có khi đã từng đăng nhập đúng
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    FIREBASE_CONFIGURED ? { status: "loading" } : { status: "signed-out" },
  );

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState((s) => (s.status === "signed-out" ? s : { status: "signed-out" }));
        return;
      }
      setState({ status: "loading" });
      const ok = await hasAccess();
      if (ok === false) {
        const email = user.email ?? "";
        await signOut(auth);
        setState({ status: "denied", email });
      } else {
        setState({ status: "ready", user });
      }
    });
  }, []);

  const signIn = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, provider);
        return;
      }
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setState({ status: "signed-out", error: "Đăng nhập chưa được. Cô kiểm tra mạng rồi thử lại nhé." });
    }
  }, []);

  /** Chỉ dùng khi chạy thử với emulator trên máy. */
  const signInDemo = useCallback(async (email: string) => {
    if (!USE_EMULATOR) return;
    const token = JSON.stringify({ sub: email, email, email_verified: true, name: "Cô Hạ Vân" });
    await signInWithCredential(getFirebaseAuth(), GoogleAuthProvider.credential(token));
  }, []);

  const logOut = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo(() => ({ state, signIn, signInDemo, logOut }), [state, signIn, signInDemo, logOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
