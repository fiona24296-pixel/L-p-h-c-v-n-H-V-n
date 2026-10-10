import type ExcelJS from "exceljs";
import { FEE_METHOD_LABELS, GRADE_LABELS } from "./defaults";
import { CLASS_HEADERS, CLASS_SHEET, STUDENT_HEADERS, STUDENT_SHEET } from "./excel-import";
import { scheduleToText } from "./schedule";
import type { ClassRoom, Student } from "./types";

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } };

function styleSheet(ws: ExcelJS.Worksheet, widths: number[]) {
  ws.columns = widths.map((w) => ({ width: w, style: { numFmt: "@" } }));
  const h = ws.getRow(1);
  h.font = { bold: true, color: { argb: "FFFFFFFF" } };
  h.fill = HEADER_FILL;
  h.alignment = { vertical: "middle", wrapText: true };
  ws.views = [{ state: "frozen", ySplit: 1, xSplit: ws.name === STUDENT_SHEET ? 2 : 0 }];
}

/**
 * Tạo file Excel theo mẫu chuẩn (sheet "Hoc sinh" + "Lop hoc").
 * Không truyền học sinh → file mẫu trống để cô điền.
 */
export async function buildStudentWorkbook(classes: ClassRoom[], students: Student[] = []) {
  const { default: Excel } = await import("exceljs");
  const wb = new Excel.Workbook();
  wb.creator = "Lớp Văn Cô Hạ Vân";

  const hs = wb.addWorksheet(STUDENT_SHEET);
  hs.addRow([...STUDENT_HEADERS]);
  const className = new Map(classes.map((c) => [c.id, c.name]));
  for (const s of students) {
    hs.addRow([
      s.id, s.name, className.get(s.classId) ?? s.classId, GRADE_LABELS[s.grade]?.replace("Khối ", "") ?? s.grade,
      s.school, s.schoolClass, s.parentName, s.zalo, s.phone, FEE_METHOD_LABELS[s.feeMethod],
      s.note, s.needsCheck,
    ]);
  }
  styleSheet(hs, [10, 26, 14, 10, 20, 12, 24, 22, 14, 16, 24, 24]);

  const lh = wb.addWorksheet(CLASS_SHEET);
  lh.addRow([...CLASS_HEADERS]);
  for (const c of [...classes].sort((a, b) => a.order - b.order)) {
    lh.addRow([
      c.id, c.name, c.grade === "TH" ? "Tiểu học" : c.grade, scheduleToText(c.schedule),
      c.feeMode === "per_session" ? "Theo buổi" : "Theo tháng",
    ]);
  }
  styleSheet(lh, [10, 16, 10, 36, 18]);
  return wb;
}

/** Tải workbook về máy với tên file cho trước. */
export async function downloadWorkbook(wb: ExcelJS.Workbook, fileName: string) {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
