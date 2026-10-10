/**
 * Chuẩn hóa SĐT thành chuỗi chỉ gồm chữ số, giữ/bù số 0 đầu.
 * Excel hay lưu SĐT dạng số nên mất số 0: 912345678 → "0912345678".
 */
export function normalizePhone(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  let s: string;
  if (typeof raw === "number") {
    s = Number.isInteger(raw) ? raw.toFixed(0) : String(raw);
  } else {
    s = String(raw);
  }
  let digits = s.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length === 11) digits = "0" + digits.slice(2);
  if (digits.length === 9 && !digits.startsWith("0")) digits = "0" + digits;
  return digits;
}

/** Trả về lời nhắc nếu SĐT có vẻ sai, ngược lại null. */
export function phoneProblem(phone: string): string | null {
  if (!phone) return "Thiếu SĐT";
  if (!phone.startsWith("0")) return "SĐT không bắt đầu bằng số 0";
  if (phone.length !== 10) return `SĐT có ${phone.length} số`;
  return null;
}

/** "0912345678" → "0978 257 762" cho dễ đọc. */
export function formatPhone(phone: string): string {
  if (phone.length === 10) return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  return phone;
}
