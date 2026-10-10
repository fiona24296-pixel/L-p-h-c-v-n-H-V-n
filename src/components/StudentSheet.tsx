"use client";

import { useState } from "react";
import { deleteStudent, saveStudent } from "@/lib/db";
import { FEE_METHOD_LABELS } from "@/lib/defaults";
import { sanitizeId } from "@/lib/excel-import";
import { normalizePhone } from "@/lib/phone";
import { studentWarnings } from "@/lib/student-warnings";
import { cleanText } from "@/lib/text";
import type { ClassRoom, Student, StudentFeeMethod } from "@/lib/types";
import { Button, Field, inputClass, Sheet } from "./ui";

function nextId(classId: string, taken: Set<string>) {
  let n = 1;
  const code = (k: number) => `${classId}-${String(k).padStart(2, "0")}`;
  while (taken.has(code(n))) n++;
  return code(n);
}

/** Bảng thêm / sửa thông tin một học sinh. */
export function StudentSheet({
  student,
  isNew,
  classes,
  allIds,
  onClose,
  onSaved,
}: {
  student: Student;
  isNew: boolean;
  classes: ClassRoom[];
  allIds: Set<string>;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [s, setS] = useState<Student>(() =>
    isNew && !student.id && student.classId ? { ...student, id: nextId(student.classId, allIds) } : student,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof Student>(k: K, v: Student[K]) => setS((p) => ({ ...p, [k]: v }));
  const warnings = studentWarnings(s);

  function changeClass(classId: string) {
    const c = classes.find((x) => x.id === classId);
    setS((p) => ({
      ...p,
      classId,
      grade: c?.grade ?? p.grade,
      // Học sinh mới: tự đặt mã theo lớp.
      id: isNew ? nextId(classId, allIds) : p.id,
      feeMethod: isNew ? (c?.feeMode === "per_session" ? "per_session" : "monthly") : p.feeMethod,
    }));
  }

  function save() {
    const data: Student = {
      ...s,
      id: sanitizeId(s.id),
      name: cleanText(s.name),
      phone: normalizePhone(s.phone),
      discountPercent: Math.min(100, Math.max(0, Number(s.discountPercent) || 0)),
    };
    if (!data.name) return setError("Cô nhập họ tên học sinh nhé.");
    if (!data.classId) return setError("Cô chọn lớp học thêm nhé.");
    if (!data.id) return setError("Cần có Mã HS.");
    if (isNew && allIds.has(data.id)) return setError(`Mã HS "${data.id}" đã có học sinh khác dùng.`);
    setBusy(true);
    // Ghi vào bộ nhớ máy ngay (mạng yếu vẫn lưu được), Firestore tự đồng bộ lên máy chủ sau.
    saveStudent(data).catch(() => alert(`Chưa lưu được ${data.name} lên máy chủ. Cô kiểm tra mạng rồi sửa lại nhé.`));
    const moved = !isNew && student.classId !== data.classId;
    const cls = classes.find((c) => c.id === data.classId)?.name;
    onSaved(isNew ? `Đã thêm ${data.name}` : moved ? `Đã chuyển ${data.name} sang ${cls}` : `Đã lưu ${data.name}`);
  }

  function remove() {
    setBusy(true);
    deleteStudent(student.id).catch(() => alert(`Chưa xóa được ${student.name}. Cô thử lại nhé.`));
    onSaved(`Đã xóa ${student.name}`);
  }

  return (
    <Sheet
      open
      title={isNew ? "Thêm học sinh" : "Thông tin học sinh"}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button className="flex-[2]" disabled={busy} onClick={save}>{busy ? "Đang lưu…" : "Lưu"}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {!isNew && warnings.length > 0 && (
          <div className="rounded-2xl bg-amber-50 p-3 text-[15px] text-amber-800">
            <p className="font-semibold">⚠ Cần bổ sung:</p>
            <ul className="mt-1 list-disc pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
          </div>
        )}
        {error && <p className="rounded-2xl bg-red-50 p-3 text-[15px] text-red-700">{error}</p>}

        <Field label="Họ tên">
          <input className={inputClass} value={s.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lớp học thêm">
            <select className={inputClass} value={s.classId} onChange={(e) => changeClass(e.target.value)}>
              <option value="">— Chọn lớp —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Mã HS">
            <input className={`${inputClass} ${!isNew ? "bg-slate-50 text-slate-500" : ""}`} value={s.id}
              readOnly={!isNew} onChange={(e) => set("id", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Trường">
            <input className={inputClass} value={s.school} onChange={(e) => set("school", e.target.value)} />
          </Field>
          <Field label="Lớp ở trường">
            <input className={inputClass} value={s.schoolClass} onChange={(e) => set("schoolClass", e.target.value)} />
          </Field>
        </div>
        <Field label="Tên phụ huynh">
          <input className={inputClass} value={s.parentName} onChange={(e) => set("parentName", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SĐT phụ huynh">
            <input className={inputClass} inputMode="tel" value={s.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Zalo/Facebook">
            <input className={inputClass} value={s.zalo} onChange={(e) => set("zalo", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cách tính học phí">
            <select className={inputClass} value={s.feeMethod} onChange={(e) => set("feeMethod", e.target.value as StudentFeeMethod)}>
              {(Object.keys(FEE_METHOD_LABELS) as StudentFeeMethod[]).map((k) => (
                <option key={k} value={k}>{FEE_METHOD_LABELS[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Miễn giảm (%)">
            <input className={inputClass} inputMode="numeric" value={s.discountPercent || ""} placeholder="0"
              onChange={(e) => set("discountPercent", Number(e.target.value.replace(/\D/g, "")) || 0)} />
          </Field>
        </div>
        <Field label="Ghi chú">
          <textarea className={`${inputClass} min-h-20`} value={s.note} onChange={(e) => set("note", e.target.value)} />
        </Field>
        <Field label="Cần kiểm tra" hint="Ghi việc cần hỏi lại phụ huynh. Xong thì xóa trống ô này.">
          <div className="flex gap-2">
            <input className={inputClass} value={s.needsCheck} onChange={(e) => set("needsCheck", e.target.value)} />
            {s.needsCheck && <Button variant="secondary" className="shrink-0 !px-3" onClick={() => set("needsCheck", "")}>Xong</Button>}
          </div>
        </Field>

        {!isNew && (
          <div className="space-y-3 rounded-2xl bg-slate-50 p-3">
            <label className="flex min-h-12 items-center justify-between gap-3">
              <span>
                <span className="block font-medium">Đã nghỉ học</span>
                <span className="block text-sm text-muted">Ẩn khỏi điểm danh, vẫn giữ lịch sử</span>
              </span>
              <input type="checkbox" className="h-7 w-7 accent-brand-600" checked={s.status === "inactive"}
                onChange={(e) => set("status", e.target.checked ? "inactive" : "active")} />
            </label>
            {!confirmDelete ? (
              <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>Xóa học sinh</Button>
            ) : (
              <div className="space-y-2 rounded-2xl bg-red-50 p-3">
                <p className="text-[15px] text-red-700">
                  Xóa hẳn <b>{student.name}</b>? Nếu em chỉ nghỉ học, cô nên đánh dấu &quot;Đã nghỉ học&quot; để giữ lịch sử.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>Không</Button>
                  <Button variant="danger" className="flex-1 !bg-red-600 !text-white" disabled={busy} onClick={remove}>Xóa</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
