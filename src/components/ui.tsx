"use client";

import { useEffect, useState } from "react";
import { IconClose } from "./icons";

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";

const BTN: Record<BtnVariant, string> = {
  primary: "bg-brand-600 text-white shadow-sm active:bg-brand-700 disabled:bg-brand-300",
  secondary: "bg-white text-brand-700 ring-1 ring-brand-200 active:bg-brand-50 disabled:text-slate-400",
  ghost: "text-brand-700 active:bg-brand-50",
  danger: "bg-white text-red-600 ring-1 ring-red-200 active:bg-red-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed ${BTN[variant]} ${className}`}
    />
  );
}

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`rounded-3xl bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-brand-100 ${className}`} />;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-brand-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[15px] font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-2xl border border-brand-200 bg-white px-4 py-2.5 text-base outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function Chip({ active, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`min-h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-[15px] font-medium transition-colors ${
        active ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-brand-200 active:bg-brand-50"
      } ${className}`}
    />
  );
}

/** Bảng trượt lên từ dưới màn hình (kiểu ứng dụng điện thoại). */
export function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between gap-2 border-b border-brand-100 px-4 py-3">
          <h2 className="text-lg font-bold text-brand-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-11 w-11 place-items-center rounded-full text-slate-500 active:bg-slate-100">
            <IconClose />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="border-t border-brand-100 px-4 pb-safe pt-3"><div className="pb-3">{footer}</div></div>}
      </div>
    </div>
  );
}

/** Thông báo nhỏ hiện vài giây. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <div role="status" className="fixed inset-x-4 bottom-24 z-[45] mx-auto max-w-md rounded-2xl bg-slate-900 px-4 py-3 text-center text-[15px] text-white shadow-lg">
      {msg}
    </div>
  ) : null;
  return { show: setMsg, node };
}

export function Spinner({ label = "Đang tải…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Card className="px-5 py-8 text-center">
      <p className="text-lg font-semibold text-brand-900">{title}</p>
      {children && <div className="mt-2 text-[15px] text-muted">{children}</div>}
    </Card>
  );
}
