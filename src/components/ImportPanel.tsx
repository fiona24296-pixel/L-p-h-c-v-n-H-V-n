"use client";

import { useRef, useState } from "react";
import { applyImport } from "@/lib/db";
import type { ImportResult } from "@/lib/excel-import";
import { studentWarnings } from "@/lib/student-warnings";
import { useData } from "./DataProvider";
import { IconUpload } from "./icons";
import { Button, Card } from "./ui";

type Step =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "preview"; fileName: string; result: ImportResult; created: number; updated: number }
  | { kind: "saving" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/** Nhập học sinh + lớp từ file Excel: chọn file → xem trước → bấm nhập. */
export function ImportPanel() {
  const { classes, students } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>({ kind: "idle" });

  async function onFile(file: File) {
    setStep({ kind: "reading" });
    try {
      const [{ default: Excel }, { parseWorkbook }] = await Promise.all([import("exceljs"), import("@/lib/excel-import")]);
      const wb = new Excel.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const result = parseWorkbook(wb, classes, students);
      const known = new Set(students.map((s) => s.id));
      const updated = result.students.filter((s) => known.has(s.id)).length;
      setStep({ kind: "preview", fileName: file.name, result, created: result.students.length - updated, updated });
    } catch (e) {
      const msg = e instanceof Error && /sheet|cột/.test(e.message)
        ? e.message
        : "Không đọc được file. Cô kiểm tra lại đúng là file Excel (.xlsx) nhé.";
      setStep({ kind: "error", message: msg });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function confirm(result: ImportResult) {
    setStep({ kind: "saving" });
    try {
      const sum = await applyImport(result, students, classes);
      setStep({
        kind: "done",
        message: `Đã nhập xong: ${sum.created} học sinh mới, ${sum.updated} học sinh được cập nhật${
          sum.classesWritten ? `, ${sum.classesWritten} lớp` : ""
        }.`,
      });
    } catch {
      setStep({ kind: "error", message: "Chưa lưu được lên máy chủ. Cô kiểm tra mạng rồi thử lại nhé." });
    }
  }

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-brand-900">Nhập từ Excel</h2>
        <p className="text-[15px] text-muted">
          File cần có sheet <b>&quot;Hoc sinh&quot;</b> (và <b>&quot;Lop hoc&quot;</b> nếu muốn đổi lịch lớp). Nhập lại file nhiều lần không bị trùng — app cập nhật theo <b>Mã HS</b>.
        </p>
      </div>
      <input ref={inputRef} type="file" className="hidden" data-testid="excel-input"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

      {(step.kind === "idle" || step.kind === "done" || step.kind === "error") && (
        <Button className="w-full" onClick={() => inputRef.current?.click()}>
          <IconUpload /> Chọn file Excel
        </Button>
      )}
      {step.kind === "reading" && <p className="text-center text-muted">Đang đọc file…</p>}
      {step.kind === "saving" && <p className="text-center text-muted">Đang lưu vào app…</p>}
      {step.kind === "done" && <p className="rounded-2xl bg-emerald-50 p-3 text-[15px] text-emerald-800">✅ {step.message}</p>}
      {step.kind === "error" && <p className="rounded-2xl bg-red-50 p-3 text-[15px] text-red-700">{step.message}</p>}

      {step.kind === "preview" && (
        <div className="space-y-3">
          <p className="truncate text-sm text-muted">File: {step.fileName}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Học sinh mới" value={step.created} />
            <Stat label="Cập nhật" value={step.updated} />
            <Stat label="⚠ Cần kiểm tra" value={step.result.students.filter((s) => studentWarnings(s).length).length} warn />
          </div>
          <div className="rounded-2xl bg-brand-50 p-3 text-[15px]">
            {step.result.classes.map((c) => {
              const n = step.result.students.filter((s) => s.classId === c.id).length;
              return (
                <div key={c.id} className="flex justify-between py-0.5">
                  <span>{c.name}</span>
                  <span className="font-semibold">{n} em</span>
                </div>
              );
            })}
          </div>
          {step.result.problems.length > 0 && (
            <details className="rounded-2xl bg-amber-50 p-3 text-[15px] text-amber-800" open={step.result.problems.length <= 5}>
              <summary className="cursor-pointer font-semibold">Lưu ý ({step.result.problems.length})</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">{step.result.problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </details>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep({ kind: "idle" })}>Hủy</Button>
            <Button className="flex-[2]" disabled={step.result.students.length === 0} onClick={() => confirm(step.result)}>
              Nhập {step.result.students.length} học sinh
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={`rounded-2xl p-2 ${warn ? "bg-amber-50 text-amber-800" : "bg-brand-50 text-brand-900"}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
