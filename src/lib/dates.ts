const TZ = "Asia/Ho_Chi_Minh";

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Thứ của ngày YYYY-MM-DD (0 = CN). */
export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Giờ hiện tại theo giờ Việt Nam, dạng HH:mm. */
export function nowHHmm(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
}

/** YYYY-MM-DD → dd/MM/yyyy */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
