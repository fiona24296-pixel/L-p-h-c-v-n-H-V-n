"use client";

import { useState } from "react";
import { saveSettings } from "@/lib/db";
import { DEFAULT_COMMENT_TAGS } from "@/lib/session";
import { cleanText } from "@/lib/text";
import { Button, inputClass, Sheet } from "../ui";

/** Thêm / sửa / xóa / sắp xếp thẻ nhận xét (lưu chung cho mọi lớp). */
export function TagEditorSheet({ tags, onClose }: { tags: string[]; onClose: () => void }) {
  const [list, setList] = useState(tags);
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = cleanText(draft);
    if (t && !list.includes(t)) setList([...list, t]);
    setDraft("");
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  };
  const save = () => {
    const clean = [...new Set(list.map(cleanText).filter(Boolean))];
    void saveSettings({ commentTags: clean });
    onClose();
  };
  return (
    <Sheet
      open
      title="Sửa thẻ nhận xét"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button className="flex-[2]" onClick={save}>Lưu thẻ</Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <input className={inputClass} placeholder="Thẻ mới, ví dụ: Có tiến bộ" value={draft}
            onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} aria-label="Thẻ mới" />
          <Button className="shrink-0" onClick={add} disabled={!cleanText(draft)}>Thêm</Button>
        </div>
        <ul className="space-y-2">
          {list.map((t, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <input className={`${inputClass} !min-h-11 !py-2`} value={t} aria-label={`Thẻ ${i + 1}`}
                onChange={(e) => setList(list.map((x, k) => (k === i ? e.target.value : x)))} />
              <button type="button" aria-label="Lên" onClick={() => move(i, -1)} className="h-11 w-9 shrink-0 rounded-xl text-slate-500 active:bg-slate-100">▲</button>
              <button type="button" aria-label="Xuống" onClick={() => move(i, 1)} className="h-11 w-9 shrink-0 rounded-xl text-slate-500 active:bg-slate-100">▼</button>
              <button type="button" aria-label={`Xóa thẻ ${t}`} onClick={() => setList(list.filter((_, k) => k !== i))}
                className="h-11 w-11 shrink-0 rounded-xl text-red-600 active:bg-red-50">✕</button>
            </li>
          ))}
        </ul>
        <button type="button" className="text-[15px] font-medium text-brand-700 underline" onClick={() => setList(DEFAULT_COMMENT_TAGS)}>
          Khôi phục bộ thẻ mặc định
        </button>
        <p className="text-sm text-muted">Sửa tên thẻ không làm thay đổi các buổi đã ghi trước đó.</p>
      </div>
    </Sheet>
  );
}
