import type ExcelJS from "exceljs";
import { isAttending } from "./session";
import type { ClassRoom, ClassSession, Student } from "./types";

export interface AttendanceMatrix {
  /** Tiêu đề cột ngày, ví dụ "12/09". */
  columns: { session: ClassSession; label: string }[];
  rows: { student: Student; cells: string[]; attended: number; absent: number }[];
}

/**
 * Bảng điểm danh kiểu cô quen: hàng là học sinh, cột là ngày,
 * "*" = có mặt (kể cả học bù), "Vắng" = vắng, "-" = chưa có trong buổi đó, "Nghỉ" = cô cho nghỉ cả lớp.
 */
export function buildAttendanceMatrix(sessions: ClassSession[], students: Student[], classId: string): AttendanceMatrix {
  const sorted = [...sessions].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const sameDay = new Map<string, number>();
  for (const s of sorted) sameDay.set(s.date, (sameDay.get(s.date) ?? 0) + 1);
  const columns = sorted.map((session) => {
    const [, m, d] = session.date.split("-");
    const label = `${d}/${m}${(sameDay.get(session.date) ?? 0) > 1 ? ` ${session.start}` : ""}`;
    return { session, label };
  });
  // Học sinh của lớp + học sinh lớp khác có tham gia (học bù).
  const ids = new Set(students.filter((s) => s.classId === classId).map((s) => s.id));
  for (const s of sorted) for (const id of Object.keys(s.records)) ids.add(id);
  const byId = new Map(students.map((s) => [s.id, s]));
  const rows = [...ids]
    .map((id) => byId.get(id))
    .filter((s): s is Student => !!s)
    // Học sinh đã nghỉ và không có buổi nào trong khoảng này thì bỏ.
    .filter((s) => s.status === "active" || sorted.some((ss) => ss.records[s.id]))
    .sort((a, b) => Number(a.classId !== classId) - Number(b.classId !== classId) || a.id.localeCompare(b.id, "vi", { numeric: true }))
    .map((student) => {
      let attended = 0;
      let absent = 0;
      const cells = columns.map(({ session }) => {
        if (session.cancelled) return "Nghỉ";
        const r = session.records[student.id];
        if (!r) return "-";
        if (isAttending(r.status)) {
          attended++;
          return "*";
        }
        absent++;
        return "Vắng";
      });
      return { student, cells, attended, absent };
    });
  return { columns, rows };
}

export async function buildAttendanceWorkbook(classRoom: ClassRoom, title: string, matrix: AttendanceMatrix) {
  const { default: Excel } = await import("exceljs");
  const wb = new Excel.Workbook();
  wb.creator = "Lớp Văn Cô Hạ Vân";
  const ws = wb.addWorksheet("Diem danh");
  const n = matrix.columns.length;
  ws.addRow([`ĐIỂM DANH ${title.toUpperCase()} — ${classRoom.name.toUpperCase()}`]);
  ws.mergeCells(1, 1, 1, Math.max(4, n + 4));
  ws.getRow(1).font = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
  ws.addRow([]);
  const header = ws.addRow(["STT", "TÊN HỌC SINH", ...matrix.columns.map((c) => c.label), "CÓ MẶT", "VẮNG"]);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  header.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } }));
  matrix.rows.forEach((r, i) => {
    const name = r.student.classId === classRoom.id ? r.student.name : `${r.student.name} (học bù)`;
    const row = ws.addRow([i + 1, name, ...r.cells, r.attended, r.absent]);
    row.alignment = { horizontal: "center" };
    row.getCell(2).alignment = { horizontal: "left" };
    r.cells.forEach((v, j) => {
      const cell = row.getCell(3 + j);
      if (v === "Vắng") cell.font = { color: { argb: "FFDC2626" }, bold: true };
      if (v === "Nghỉ") cell.font = { color: { argb: "FF94A3B8" } };
    });
  });
  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 28;
  for (let j = 0; j < n; j++) ws.getColumn(3 + j).width = 8;
  ws.getColumn(3 + n).width = 9;
  ws.getColumn(4 + n).width = 8;
  ws.views = [{ state: "frozen", xSplit: 2, ySplit: 3 }];
  const border: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFBFDBFE" } }, bottom: { style: "thin", color: { argb: "FFBFDBFE" } },
    left: { style: "thin", color: { argb: "FFBFDBFE" } }, right: { style: "thin", color: { argb: "FFBFDBFE" } },
  };
  for (let r = 3; r <= ws.rowCount; r++) ws.getRow(r).eachCell({ includeEmpty: true }, (c) => (c.border = border));
  return wb;
}
