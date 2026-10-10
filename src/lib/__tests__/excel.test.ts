import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CLASSES } from "../defaults";
import { buildStudentWorkbook } from "../excel-export";
import { parseWorkbook, STUDENT_HEADERS } from "../excel-import";
import type { Student } from "../types";

function wbWith(rows: unknown[][], classRows?: unknown[][]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Hoc sinh");
  ws.addRow([...STUDENT_HEADERS]);
  rows.forEach((r) => ws.addRow(r));
  if (classRows) {
    const lh = wb.addWorksheet("Lop hoc");
    lh.addRow(["Mã lớp", "Tên lớp", "Khối", "Lịch học", "Cách tính học phí"]);
    classRows.forEach((r) => lh.addRow(r));
  }
  return wb;
}

describe("Nhập Excel", () => {
  it("đọc học sinh, giữ số 0 của SĐT, tự nhận lớp", () => {
    const wb = wbWith([
      ["V6-01", "Lê Minh An", "Văn 6", "6", "Trường A", "6", "Lê Thị Hoa", "Hoa Lê", 912345678, "Theo tháng", "", ""],
      ["TH-01", " Trần  Thu Hà ", "Văn tiểu học", "Tiểu học", "Trường B", "5", "Trần Văn Bình", "", "0381112222", "", "", "Thiếu SĐT; Hỏi lại địa chỉ"],
      ["V7-05", "Phạm Gia Bảo", "Văn 7", "", "", "7", "Phạm Thị Lan", "", "0977000111", "Buổi lẻ", "", ""],
    ]);
    const r = parseWorkbook(wb);
    expect(r.hasClassSheet).toBe(false);
    expect(r.classes).toHaveLength(6);
    expect(r.problems).toEqual([]);
    expect(r.students[0]).toMatchObject({ id: "V6-01", classId: "V6", grade: "6", phone: "0912345678", feeMethod: "monthly" });
    expect(r.students[1]).toMatchObject({ name: "Trần Thu Hà", classId: "TH", grade: "TH", feeMethod: "per_session", needsCheck: "Hỏi lại địa chỉ" });
    expect(r.students[2]).toMatchObject({ grade: "7", feeMethod: "odd_sessions" });
  });

  it("báo lỗi lớp không tồn tại, mã trùng, và tự tạo mã còn thiếu", () => {
    const wb = wbWith([
      ["V6-01", "A", "Văn 6"],
      ["V6-01", "B", "Văn 6"],
      ["", "C", "Văn 6"],
      ["", "D", "Văn 10"],
    ]);
    const r = parseWorkbook(wb, [], [{ id: "V6-02", name: "X", classId: "V6" }]);
    expect(r.students.map((s) => s.id)).toEqual(["V6-01", "V6-03"]);
    expect(r.problems).toHaveLength(3);
  });

  it("học sinh không có mã nhưng trùng tên + lớp thì dùng lại mã cũ", () => {
    const wb = wbWith([["", "Đào Minh Châu", "Văn tiểu học"]]);
    const r = parseWorkbook(wb, [], [{ id: "TH-09", name: "Đào Minh Châu", classId: "TH" }]);
    expect(r.students[0].id).toBe("TH-09");
    expect(r.problems).toEqual([]);
  });

  it("đọc sheet Lop hoc", () => {
    const wb = wbWith([["X-1", "A", "Văn 10A"]], [["V10", "Văn 10A", "9", "T2, T4 18:00-20:00", "Theo tháng"]]);
    const r = parseWorkbook(wb);
    expect(r.hasClassSheet).toBe(true);
    expect(r.classes).toEqual([
      { id: "V10", name: "Văn 10A", grade: "9", feeMode: "monthly", order: 1,
        schedule: [{ weekday: 1, start: "18:00", end: "20:00" }, { weekday: 3, start: "18:00", end: "20:00" }] },
    ]);
    expect(r.students[0].classId).toBe("V10");
  });

  it("thiếu sheet Hoc sinh thì báo rõ ràng", () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("V6");
    expect(() => parseWorkbook(wb)).toThrow(/Hoc sinh/);
  });

  it("xuất rồi nhập lại cho ra cùng dữ liệu", async () => {
    const student: Student = {
      id: "V8-02", name: "Vũ Thành Trung", classId: "V8", grade: "8", school: "Trường C", schoolClass: "8",
      parentName: "Vũ Thị Mai", zalo: "Mai Vũ", phone: "0355000222", feeMethod: "monthly",
      note: "", needsCheck: "Hỏi lại SĐT bố", status: "active", discountPercent: 0,
    };
    const wb = await buildStudentWorkbook(DEFAULT_CLASSES, [student]);
    const buf = await wb.xlsx.writeBuffer();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf);
    const r = parseWorkbook(wb2);
    expect(r.hasClassSheet).toBe(true);
    expect(r.classes).toEqual(DEFAULT_CLASSES);
    const rest: Partial<Student> = { ...student };
    delete rest.status;
    delete rest.discountPercent;
    expect(r.students).toEqual([rest]);
  });
});
