import { phoneProblem } from "./phone";
import { normalizeKey } from "./text";
import type { Student } from "./types";

type WarnFields = Pick<Student, "phone" | "parentName" | "schoolClass" | "needsCheck">;

/** Các điểm cần bổ sung của một học sinh: app tự phát hiện + ghi chú "Cần kiểm tra" của cô. */
export function studentWarnings(s: WarnFields): string[] {
  const list: string[] = [];
  const p = phoneProblem(s.phone);
  if (p) list.push(p);
  if (!s.parentName.trim()) list.push("Thiếu tên phụ huynh");
  if (!s.schoolClass.trim()) list.push("Thiếu lớp ở trường");
  if (s.needsCheck.trim()) list.push(s.needsCheck.trim());
  return list;
}

// Những lời nhắc app tự kiểm tra được — không cần lưu lại trong "Cần kiểm tra",
// để khi cô bổ sung xong thì dấu ⚠ tự mất.
const AUTO_PREFIXES = ["thieu sdt", "sdt ", "thieu ten phu huynh", "thieu lop o truong"];

/** Bỏ khỏi ô "Cần kiểm tra" các mục app tự kiểm tra. "Thiếu SĐT; Hỏi lại trường" → "Hỏi lại trường". */
export function stripAutoChecks(text: string): string {
  return text
    .split(/[;\n]+/)
    .map((t) => t.trim())
    .filter((t) => t && !AUTO_PREFIXES.some((p) => normalizeKey(t).startsWith(p)))
    .join("; ");
}
