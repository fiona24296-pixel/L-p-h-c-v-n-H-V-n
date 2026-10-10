"use client";

import { useState } from "react";
import { matchesSearch } from "@/lib/text";
import type { ClassRoom, Student } from "@/lib/types";
import { inputClass, Sheet } from "../ui";

/** Chọn học sinh lớp khác đến học bù buổi này. */
export function GuestSheet({
  students,
  classById,
  excludeIds,
  onPick,
  onClose,
}: {
  students: Student[];
  classById: Map<string, ClassRoom>;
  excludeIds: Set<string>;
  onPick: (s: Student) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const list = students
    .filter((s) => s.status === "active" && !excludeIds.has(s.id) && matchesSearch([s.name, s.id], q))
    .slice(0, 40);
  return (
    <Sheet open title="Thêm học sinh học bù" onClose={onClose}>
      <div className="space-y-3">
        <input type="search" autoFocus className={inputClass} placeholder="Gõ tên học sinh…" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="divide-y divide-brand-50">
          {list.map((s) => (
            <li key={s.id}>
              <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 text-left active:bg-brand-50" onClick={() => onPick(s)}>
                <span className="font-medium">{s.name}</span>
                <span className="shrink-0 text-sm text-muted">{classById.get(s.classId)?.name ?? s.classId}</span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="py-6 text-center text-muted">Không tìm thấy</li>}
        </ul>
      </div>
    </Sheet>
  );
}
