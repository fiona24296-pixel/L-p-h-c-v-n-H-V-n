/** Bỏ dấu tiếng Việt: "Hạ Vân" → "Ha Van". */
export function removeDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Chuẩn hóa để so khớp / tìm kiếm: bỏ dấu, chữ thường, gộp khoảng trắng. */
export function normalizeKey(s: string): string {
  return removeDiacritics(s).toLowerCase().replace(/\s+/g, " ").trim();
}

/** Gộp khoảng trắng thừa. */
export function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function matchesSearch(haystack: string[], query: string): boolean {
  const q = normalizeKey(query);
  if (!q) return true;
  return haystack.some((h) => normalizeKey(h).includes(q));
}
