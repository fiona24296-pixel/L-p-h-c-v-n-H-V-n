"use client";

import { useState } from "react";
import { ATTITUDE_LABELS, HOMEWORK_OPTIONS, HOMEWORK_STYLE, homeworkColor } from "@/lib/session";
import type { Attitude, HomeworkPercent } from "@/lib/types";
import { Button, Sheet } from "../ui";

export interface BulkValues {
  homework?: HomeworkPercent | null;
  attitude?: Attitude | null;
  /** Thẻ thêm vào (không xóa thẻ sẵn có của từng em). */
  addTags: string[];
}

/** "Áp dụng cho cả lớp": chọn BTVN / ý thức / thẻ một lần cho tất cả em có mặt. */
export function BulkApplySheet({
  tags,
  attendingCount,
  initial,
  onApply,
  onClose,
}: {
  tags: string[];
  attendingCount: number;
  initial?: BulkValues;
  onApply: (v: BulkValues) => void;
  onClose: () => void;
}) {
  const [v, setV] = useState<BulkValues>(initial ?? { addTags: [] });
  const nothing = v.homework === undefined && v.attitude === undefined && v.addTags.length === 0;
  return (
    <Sheet
      open
      title="Áp dụng cho cả lớp"
      onClose={onClose}
      footer={
        <Button className="w-full" disabled={nothing} onClick={() => onApply(v)}>
          Áp dụng cho {attendingCount} em có mặt
        </Button>
      }
    >
      <div className="space-y-5">
        <p className="text-[15px] text-muted">Chỉ mục nào cô chọn mới được ghi đè. Em vắng không bị đổi.</p>
        <section className="space-y-2">
          <h3 className="text-[15px] font-semibold text-slate-700">Bài tập về nhà</h3>
          <div className="flex gap-2">
            {HOMEWORK_OPTIONS.map((p) => (
              <button key={p} type="button" onClick={() => setV({ ...v, homework: v.homework === p ? undefined : p })}
                className={`min-h-12 flex-1 rounded-2xl text-[15px] font-bold ${
                  v.homework === p ? `${HOMEWORK_STYLE[homeworkColor(p)]} ring-2 ring-current` : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}>
                {p}%
              </button>
            ))}
          </div>
        </section>
        <section className="space-y-2">
          <h3 className="text-[15px] font-semibold text-slate-700">Ý thức</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ATTITUDE_LABELS) as Attitude[]).map((a) => (
              <button key={a} type="button" onClick={() => setV({ ...v, attitude: v.attitude === a ? undefined : a })}
                className={`min-h-12 rounded-2xl px-3 text-[15px] font-medium ${
                  v.attitude === a ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}>
                {ATTITUDE_LABELS[a]}
              </button>
            ))}
          </div>
        </section>
        <section className="space-y-2">
          <h3 className="text-[15px] font-semibold text-slate-700">Thêm thẻ nhận xét</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => {
              const on = v.addTags.includes(t);
              return (
                <button key={t} type="button" aria-pressed={on}
                  onClick={() => setV({ ...v, addTags: on ? v.addTags.filter((x) => x !== t) : [...v.addTags, t] })}
                  className={`min-h-10 rounded-full px-3.5 text-[15px] ${on ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-brand-200"}`}>
                  {on && "✓ "}{t}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </Sheet>
  );
}
