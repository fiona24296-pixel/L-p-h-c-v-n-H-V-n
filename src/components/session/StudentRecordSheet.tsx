"use client";

import { deleteField } from "firebase/firestore";
import { patchSession, removeFromSession } from "@/lib/db";
import {
  ATTITUDE_LABELS,
  HOMEWORK_OPTIONS,
  HOMEWORK_STYLE,
  homeworkColor,
  parseScore,
  STATUS_LABELS,
  STATUS_ORDER,
  STATUS_STYLE,
} from "@/lib/session";
import type { AttendanceRecord, Attitude, ClassSession, Student } from "@/lib/types";
import { Button, inputClass, Sheet } from "../ui";
import { DebouncedField } from "./DebouncedField";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[15px] font-semibold text-slate-700">{title}</h3>
      {children}
    </section>
  );
}

/** Bảng chi tiết 1 em trong buổi: trạng thái, % BTVN, ý thức, điểm, thẻ nhận xét, ghi chú. */
export function StudentRecordSheet({
  session,
  student,
  record,
  tags,
  position,
  onPrev,
  onNext,
  onClose,
  onApplyAll,
  onEditTags,
}: {
  session: ClassSession;
  student: Student;
  record: AttendanceRecord;
  tags: string[];
  position: string;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
  onApplyAll: (rec: AttendanceRecord) => void;
  onEditTags: () => void;
}) {
  const set = (patch: Partial<Record<keyof AttendanceRecord, unknown>>) =>
    void patchSession(session.id, { records: { [student.id]: patch } });
  const toggleTag = (t: string) =>
    set({ tags: record.tags.includes(t) ? record.tags.filter((x) => x !== t) : [...record.tags, t] });
  // Thẻ cũ đã bị xóa khỏi danh sách vẫn hiện để bỏ chọn được.
  const allTags = [...tags, ...record.tags.filter((t) => !tags.includes(t))];

  return (
    <Sheet
      open
      title={student.name}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1 !px-2" disabled={!onPrev} onClick={onPrev}>‹ Em trước</Button>
          <span className="grid place-items-center px-1 text-sm text-muted">{position}</span>
          <Button className="flex-1 !px-2" onClick={onNext ?? onClose}>{onNext ? "Em sau ›" : "Xong"}</Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Section title="Điểm danh">
          <div className="grid grid-cols-2 gap-2">
            {STATUS_ORDER.map((s) => (
              <button key={s} type="button" onClick={() => set({ status: s })}
                className={`min-h-12 rounded-2xl px-3 text-[15px] font-semibold ring-1 ${
                  record.status === s ? `${STATUS_STYLE[s]} ring-2` : "bg-white text-slate-600 ring-slate-200"
                }`}>
                {record.status === s && "✓ "}{STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Bài tập về nhà">
          <div className="flex gap-2">
            {HOMEWORK_OPTIONS.map((p) => (
              <button key={p} type="button" onClick={() => set({ homework: record.homework === p ? null : p })}
                className={`min-h-12 flex-1 rounded-2xl text-[15px] font-bold ${
                  record.homework === p ? `${HOMEWORK_STYLE[homeworkColor(p)]} ring-2 ring-current` : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}>
                {p}%
              </button>
            ))}
          </div>
        </Section>

        <Section title="Ý thức">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ATTITUDE_LABELS) as Attitude[]).map((a) => (
              <button key={a} type="button" onClick={() => set({ attitude: record.attitude === a ? null : a })}
                className={`min-h-12 rounded-2xl px-3 text-[15px] font-medium ${
                  record.attitude === a
                    ? a === "good" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}>
                {ATTITUDE_LABELS[a]}
              </button>
            ))}
          </div>
        </Section>

        {session.testName && (
          <Section title={`Điểm ${session.testName}`}>
            <div className="grid grid-cols-2 gap-2">
              {session.testParts.map((part) => (
                <label key={part} className="block">
                  <span className="mb-1 block text-sm text-muted">{part}</span>
                  <DebouncedField
                    className={inputClass}
                    inputMode="decimal"
                    placeholder="0–10"
                    aria-label={`Điểm ${part}`}
                    value={record.scores[part] !== undefined ? String(record.scores[part]).replace(".", ",") : ""}
                    onCommit={(v) => {
                      const n = parseScore(v);
                      set({ scores: { [part]: n === null ? deleteField() : n } });
                    }}
                  />
                </label>
              ))}
            </div>
          </Section>
        )}

        <Section title="Thẻ nhận xét">
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => {
              const on = record.tags.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggleTag(t)} aria-pressed={on}
                  className={`min-h-10 rounded-full px-3.5 text-[15px] ${
                    on ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-brand-200"
                  }`}>
                  {on && "✓ "}{t}
                </button>
              );
            })}
            <button type="button" onClick={onEditTags} className="min-h-10 rounded-full px-3.5 text-[15px] font-medium text-brand-700 border border-dashed border-brand-300">
              ✎ Sửa thẻ
            </button>
          </div>
        </Section>

        <Section title="Ghi chú riêng">
          <DebouncedField multiline className={`${inputClass} min-h-20`} value={record.note} aria-label="Ghi chú"
            placeholder="Ví dụ: đi muộn 15 phút" onCommit={(v) => set({ note: v })} />
        </Section>

        <div className="space-y-2 rounded-2xl bg-brand-50 p-3">
          <Button variant="secondary" className="w-full" onClick={() => onApplyAll(record)}>
            Áp dụng BTVN, ý thức, thẻ của em này cho cả lớp
          </Button>
          {record.guest && (
            <Button variant="danger" className="w-full" onClick={() => {
              void removeFromSession(session.id, student.id);
              onClose();
            }}>
              Bỏ em khỏi buổi này
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
