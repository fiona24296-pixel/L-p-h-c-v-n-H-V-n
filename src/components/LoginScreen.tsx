"use client";

import { useState } from "react";
import { FIREBASE_CONFIGURED, USE_EMULATOR } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { Button, Card, inputClass } from "./ui";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function LoginScreen() {
  const { state, signIn, signInDemo } = useAuth();
  const [busy, setBusy] = useState(false);
  const [demoEmail, setDemoEmail] = useState("test@lopvan.local");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="mx-auto h-24 w-24 rounded-3xl shadow-md" />
        <h1 className="mt-5 text-3xl font-bold text-brand-900">Lớp Văn Cô Hạ Vân</h1>
        <p className="mt-2 text-muted">Điểm danh · Nhận xét · Học phí</p>
      </div>

      {!FIREBASE_CONFIGURED ? (
        <Card className="text-[15px] leading-relaxed text-slate-700">
          <p className="font-semibold text-brand-900">App chưa được kết nối Firebase.</p>
          <p className="mt-2">Cô làm theo hướng dẫn &quot;Tạo dự án Firebase&quot; em đã gửi, rồi mở lại trang này nhé.</p>
        </Card>
      ) : (
        <Card className="space-y-4">
          {state.status === "denied" && (
            <p className="rounded-2xl bg-red-50 p-3 text-[15px] text-red-700">
              Tài khoản <b>{state.email}</b> không có quyền vào app. Cô chọn đúng tài khoản Google của cô nhé.
            </p>
          )}
          {state.status === "signed-out" && state.error && (
            <p className="rounded-2xl bg-red-50 p-3 text-[15px] text-red-700">{state.error}</p>
          )}
          <Button
            variant="secondary"
            className="w-full !min-h-14 text-lg"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await signIn();
              } finally {
                setBusy(false);
              }
            }}
          >
            <GoogleLogo /> Đăng nhập bằng Google
          </Button>
          <p className="text-center text-sm text-muted">Chỉ tài khoản của cô Hạ Vân mới vào được.</p>

          {USE_EMULATOR && (
            <div className="space-y-2 border-t border-dashed border-brand-200 pt-4">
              <p className="text-sm font-medium text-amber-700">Chế độ chạy thử (chỉ có trên máy thử nghiệm)</p>
              <input className={inputClass} value={demoEmail} onChange={(e) => setDemoEmail(e.target.value)} aria-label="Email thử" />
              <Button className="w-full" onClick={() => signInDemo(demoEmail)}>Đăng nhập thử</Button>
            </div>
          )}
        </Card>
      )}
    </main>
  );
}
