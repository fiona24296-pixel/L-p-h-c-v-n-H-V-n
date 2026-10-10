import ExcelJS from "exceljs";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseWorkbook } from "../excel-import";
import { studentWarnings } from "../student-warnings";

// Chỉ chạy khi có file thật trên máy (file thật không đưa lên GitHub).
const file = process.env.REAL_XLSX;
describe.skipIf(!file || !existsSync(file))("File thật của cô", () => {
  it("đọc đủ học sinh", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file!);
    const r = parseWorkbook(wb);
    console.log("lớp", r.classes.length, "học sinh", r.students.length, "lỗi", r.problems);
    const perClass = Object.groupBy(r.students, (s) => s.classId);
    console.log(Object.fromEntries(Object.entries(perClass).map(([k, v]) => [k, v!.length])));
    console.log("cần kiểm tra", r.students.filter((s) => studentWarnings(s).length).length);
    expect(r.problems).toEqual([]);
    expect(r.students.length).toBeGreaterThan(0);
  });
});
