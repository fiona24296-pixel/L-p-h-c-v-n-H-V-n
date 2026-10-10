import type ExcelJS from "exceljs";
import { DEFAULT_CLASSES } from "./defaults";
import { normalizePhone } from "./phone";
import { parseSchedule } from "./schedule";
import { stripAutoChecks } from "./student-warnings";
import { cleanText, normalizeKey } from "./text";
import type { ClassFeeMode, ClassRoom, Grade, Student, StudentFeeMethod } from "./types";

/** Các trường của học sinh lấy từ file Excel (không gồm trạng thái, miễn giảm… do app quản lý). */
export type ImportedStudent = Omit<Student, "status" | "discountPercent" | "updatedAt">;

export interface ImportResult {
  classes: ClassRoom[];
  /** true nếu file có sheet "Lop hoc". */
  hasClassSheet: boolean;
  students: ImportedStudent[];
  /** Lời nhắc cho cô (dòng bị bỏ qua, mã tự tạo…). */
  problems: string[];
}

export const STUDENT_SHEET = "Hoc sinh";
export const CLASS_SHEET = "Lop hoc";

export const STUDENT_HEADERS = [
  "Mã HS", "Họ tên", "Lớp học thêm", "Khối", "Trường", "Lớp ở trường", "Tên phụ huynh",
  "Zalo/Facebook", "SĐT phụ huynh", "Cách tính học phí", "Ghi chú", "Cần kiểm tra",
] as const;
export const CLASS_HEADERS = ["Mã lớp", "Tên lớp", "Khối", "Lịch học", "Cách tính học phí"] as const;

type StudentField =
  | "id" | "name" | "className" | "grade" | "school" | "schoolClass" | "parentName"
  | "zalo" | "phone" | "feeMethod" | "note" | "needsCheck";
type ClassField = "id" | "name" | "grade" | "schedule" | "feeMode";

const STUDENT_ALIASES: Record<StudentField, string[]> = {
  id: ["ma hs", "ma hoc sinh", "ma"],
  name: ["ho ten", "ho va ten", "ten hoc sinh", "hoc sinh"],
  className: ["lop hoc them", "lop hoc", "lop day them"],
  grade: ["khoi"],
  school: ["truong"],
  schoolClass: ["lop o truong", "lop"],
  parentName: ["ten phu huynh", "phu huynh"],
  zalo: ["zalo/facebook", "zalo", "facebook"],
  phone: ["sdt phu huynh", "sdt", "so dien thoai", "dien thoai"],
  feeMethod: ["cach tinh hoc phi", "hoc phi"],
  note: ["ghi chu"],
  needsCheck: ["can kiem tra"],
};
const CLASS_ALIASES: Record<ClassField, string[]> = {
  id: ["ma lop"],
  name: ["ten lop", "lop"],
  grade: ["khoi"],
  schedule: ["lich hoc", "lich"],
  feeMode: ["cach tinh hoc phi", "hoc phi"],
};

/** Đọc giá trị ô Excel thành chuỗi (số nguyên không có ".0", rich text, công thức…). */
export function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isInteger(value) ? value.toFixed(0) : String(value);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Có" : "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((r) => r.text).join("");
    if ("result" in value) return cellToString(value.result as ExcelJS.CellValue);
    if ("text" in value) return String(value.text);
    if ("error" in value) return "";
  }
  return String(value);
}

function findSheet(wb: ExcelJS.Workbook, name: string): ExcelJS.Worksheet | undefined {
  const key = normalizeKey(name);
  return wb.worksheets.find((ws) => normalizeKey(ws.name) === key);
}

/** Tìm dòng tiêu đề (trong 10 dòng đầu) và vị trí cột cho từng trường. */
function mapHeaders<F extends string>(ws: ExcelJS.Worksheet, aliases: Record<F, string[]>, mustHave: NoInfer<F>) {
  for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
    const row = ws.getRow(r);
    const cols = new Map<F, number>();
    const used = new Set<number>();
    // Ưu tiên tên cột khớp chính xác, theo thứ tự alias (để "Lớp ở trường" không bị nhầm với "Lớp").
    const headers: { col: number; key: string }[] = [];
    row.eachCell((cell, col) => headers.push({ col, key: normalizeKey(cellToString(cell.value)) }));
    for (const field of Object.keys(aliases) as F[]) {
      for (const alias of aliases[field]) {
        const h = headers.find((x) => x.key === alias && !used.has(x.col));
        if (h) {
          cols.set(field, h.col);
          used.add(h.col);
          break;
        }
      }
    }
    if (cols.has(mustHave)) return { headerRow: r, cols };
  }
  return null;
}

function parseGrade(text: string): Grade | null {
  const k = normalizeKey(text);
  if (!k) return null;
  if (k.includes("tieu hoc") || k === "th" || /^[1-5]$/.test(k)) return "TH";
  const m = k.match(/[6-9]/);
  return m ? (m[0] as Grade) : null;
}

function parseClassFeeMode(text: string, grade: Grade): ClassFeeMode {
  const k = normalizeKey(text);
  if (k.includes("buoi")) return "per_session";
  if (k.includes("thang")) return "monthly";
  return grade === "TH" ? "per_session" : "monthly";
}

export function parseStudentFeeMethod(text: string, classRoom?: ClassRoom): StudentFeeMethod {
  const k = normalizeKey(text);
  if (k.includes("le")) return "odd_sessions";
  if (k.includes("buoi")) return "per_session";
  if (k.includes("thang")) return "monthly";
  return classRoom?.feeMode === "per_session" ? "per_session" : "monthly";
}

/** Tạo mã lớp từ tên: "Văn 9.1" → "V91", "Văn tiểu học" → "TH". */
function classIdFromName(name: string): string {
  const k = normalizeKey(name);
  if (k.includes("tieu hoc")) return "TH";
  const digits = k.replace(/[^0-9]/g, "");
  return digits ? `V${digits}` : removeNonId(name).toUpperCase().slice(0, 10) || "LOP";
}

function removeNonId(s: string) {
  return normalizeKey(s).replace(/[^a-z0-9]/g, "");
}

/** Mã HS / mã lớp dùng làm id Firestore: bỏ ký tự "/" và khoảng trắng thừa. */
export function sanitizeId(s: string): string {
  return cleanText(s).replace(/[/\\#?[\]]/g, "-").slice(0, 40);
}

function readClasses(ws: ExcelJS.Worksheet, problems: string[]): ClassRoom[] {
  const map = mapHeaders(ws, CLASS_ALIASES, "name");
  if (!map) {
    problems.push(`Sheet "${CLASS_SHEET}": không thấy cột "Tên lớp" — dùng 6 lớp mặc định.`);
    return [];
  }
  const out: ClassRoom[] = [];
  for (let r = map.headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const get = (f: ClassField) => {
      const c = map.cols.get(f);
      return c ? cleanText(cellToString(row.getCell(c).value)) : "";
    };
    const name = get("name");
    if (!name) continue;
    const grade = parseGrade(get("grade")) ?? parseGrade(name) ?? "6";
    const id = sanitizeId(get("id")) || classIdFromName(name);
    const scheduleText = get("schedule");
    const schedule = parseSchedule(scheduleText);
    if (scheduleText && schedule.length === 0) {
      problems.push(`Lớp "${name}": không đọc được lịch "${scheduleText}" (ví dụ đúng: T4 17:00-19:00; T7 17:00-19:00).`);
    }
    if (out.some((c) => c.id === id)) {
      problems.push(`Sheet "${CLASS_SHEET}" dòng ${r}: mã lớp "${id}" bị trùng — bỏ qua.`);
      continue;
    }
    out.push({ id, name, grade, schedule, feeMode: parseClassFeeMode(get("feeMode"), grade), order: out.length + 1 });
  }
  return out;
}

function findClass(classes: ClassRoom[], text: string): ClassRoom | undefined {
  const k = normalizeKey(text);
  if (!k) return undefined;
  return (
    classes.find((c) => normalizeKey(c.name) === k) ??
    classes.find((c) => normalizeKey(c.id) === k) ??
    classes.find((c) => normalizeKey(c.name) === `van ${k}`) ??
    classes.find((c) => removeNonId(c.name) === removeNonId(k))
  );
}

/**
 * Đọc file Excel theo mẫu chuẩn: sheet "Hoc sinh" (bắt buộc) và "Lop hoc" (không bắt buộc).
 * `existingClasses`: các lớp đã có trong app, dùng khi file không có sheet "Lop hoc".
 */
export function parseWorkbook(
  wb: ExcelJS.Workbook,
  existingClasses: ClassRoom[] = [],
  existingStudents: Pick<Student, "id" | "name" | "classId">[] = [],
): ImportResult {
  const problems: string[] = [];
  const classSheet = findSheet(wb, CLASS_SHEET);
  let classes = classSheet ? readClasses(classSheet, problems) : [];
  const hasClassSheet = classes.length > 0;
  if (!hasClassSheet) classes = existingClasses.length ? existingClasses : DEFAULT_CLASSES;

  const ws = findSheet(wb, STUDENT_SHEET);
  if (!ws) {
    const names = wb.worksheets.map((w) => `"${w.name}"`).join(", ");
    throw new Error(
      `Không thấy sheet "${STUDENT_SHEET}" trong file (file đang có: ${names}). ` +
        `Cô tải "File Excel mẫu" trong Cài đặt rồi dán dữ liệu vào nhé.`,
    );
  }
  const map = mapHeaders(ws, STUDENT_ALIASES, "name");
  if (!map) throw new Error(`Sheet "${STUDENT_SHEET}" không có cột "Họ tên".`);

  const students: ImportedStudent[] = [];
  const seen = new Set<string>();
  const takenIds = new Set(existingStudents.map((s) => s.id));
  const needId: { s: ImportedStudent; row: number }[] = [];

  for (let r = map.headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const raw = (f: StudentField) => {
      const c = map.cols.get(f);
      return c ? row.getCell(c).value : null;
    };
    const get = (f: StudentField) => cleanText(cellToString(raw(f)));
    const name = get("name");
    if (!name) continue;

    const classText = get("className");
    const classRoom = findClass(classes, classText);
    if (!classRoom) {
      problems.push(
        classText
          ? `Dòng ${r} (${name}): không tìm thấy lớp "${classText}" — bỏ qua.`
          : `Dòng ${r} (${name}): chưa ghi "Lớp học thêm" — bỏ qua.`,
      );
      continue;
    }
    const student: ImportedStudent = {
      id: sanitizeId(get("id")),
      name,
      classId: classRoom.id,
      grade: parseGrade(get("grade")) ?? classRoom.grade,
      school: get("school"),
      schoolClass: get("schoolClass"),
      parentName: get("parentName"),
      zalo: get("zalo"),
      phone: normalizePhone(raw("phone")),
      feeMethod: parseStudentFeeMethod(get("feeMethod"), classRoom),
      note: get("note"),
      needsCheck: stripAutoChecks(get("needsCheck")),
    };
    if (!student.id) {
      needId.push({ s: student, row: r });
      continue;
    }
    if (seen.has(student.id)) {
      problems.push(`Dòng ${r} (${name}): Mã HS "${student.id}" bị trùng trong file — bỏ qua dòng này.`);
      continue;
    }
    seen.add(student.id);
    students.push(student);
  }

  // Học sinh chưa có Mã HS: nếu trùng tên + lớp với em đã có trong app thì dùng lại mã cũ,
  // nếu không thì tự tạo theo lớp, ví dụ V6-37.
  for (const { s, row } of needId) {
    const same = existingStudents.find(
      (e) => e.classId === s.classId && normalizeKey(e.name) === normalizeKey(s.name) && !seen.has(e.id),
    );
    if (same) {
      s.id = same.id;
      seen.add(s.id);
      students.push(s);
      continue;
    }
    let n = 1;
    const code = (k: number) => `${s.classId}-${String(k).padStart(2, "0")}`;
    while (seen.has(code(n)) || takenIds.has(code(n))) n++;
    s.id = `${s.classId}-${String(n).padStart(2, "0")}`;
    seen.add(s.id);
    students.push(s);
    problems.push(`Dòng ${row} (${s.name}): chưa có Mã HS — app tự tạo mã ${s.id}.`);
  }

  return { classes, hasClassSheet, students, problems };
}
