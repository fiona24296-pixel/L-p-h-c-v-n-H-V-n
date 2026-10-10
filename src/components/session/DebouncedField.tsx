"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ô nhập tự lưu: gõ xong ~0,7 giây (hoặc rời khỏi ô) thì gọi onCommit.
 * Khi máy khác sửa, ô tự cập nhật nếu cô không đang gõ.
 */
export function DebouncedField({
  value,
  onCommit,
  multiline,
  className,
  ...rest
}: {
  value: string;
  onCommit: (v: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  "aria-label"?: string;
  id?: string;
}) {
  const [local, setLocal] = useState(value);
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(value);

  useEffect(() => {
    latest.current = value;
    if (!focused.current) setLocal(value);
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (v: string) => {
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => v !== latest.current && onCommit(v), 700);
  };
  const blur = () => {
    focused.current = false;
    clearTimeout(timer.current);
    if (local !== latest.current) onCommit(local);
  };
  const common = {
    ...rest,
    value: local,
    className,
    onFocus: () => (focused.current = true),
    onBlur: blur,
  };
  return multiline ? (
    <textarea {...common} onChange={(e) => change(e.target.value)} />
  ) : (
    <input {...common} onChange={(e) => change(e.target.value)} />
  );
}
