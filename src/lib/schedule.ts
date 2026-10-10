import type { ClassRoom, ScheduleSlot } from "./types";

export const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const WEEKDAY_FULL = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const TIME_RE = /(\d{1,2})[:h](\d{2})?\s*[-–—]\s*(\d{1,2})[:h](\d{2})?/i;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseWeekday(token: string): number | null {
  const t = token.toUpperCase().replace(/\s|\./g, "");
  if (t === "CN" || t === "CHUNHAT") return 0;
  const m = t.match(/^(?:T|THU|THỨ)?([2-7])$/);
  return m ? Number(m[1]) - 1 : null;
}

/**
 * Đọc lịch dạng chữ: "T4 17:00-19:00; T7 17:00-19:00" hoặc "T2, T6 17:00-19:00".
 * Trả về danh sách ca, bỏ qua phần không hiểu.
 */
export function parseSchedule(text: string): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  for (const part of text.split(/[;\n|]+/)) {
    const time = part.match(TIME_RE);
    if (!time) continue;
    const start = `${pad(Number(time[1]))}:${time[2] ?? "00"}`;
    const end = `${pad(Number(time[3]))}:${time[4] ?? "00"}`;
    const dayPart = part.slice(0, time.index);
    for (const tok of dayPart.split(/[,\s]+/).filter(Boolean)) {
      const wd = parseWeekday(tok);
      if (wd !== null) slots.push({ weekday: wd, start, end });
    }
  }
  return sortSlots(slots);
}

export function sortSlots(slots: ScheduleSlot[]): ScheduleSlot[] {
  // Thứ 2 → CN
  const key = (s: ScheduleSlot) => ((s.weekday + 6) % 7) * 10000 + Number(s.start.replace(":", ""));
  return [...slots].sort((a, b) => key(a) - key(b));
}

/** "T4, T7 17:00–19:00" — gộp các ngày cùng giờ. */
export function formatSchedule(slots: ScheduleSlot[]): string {
  const groups = new Map<string, number[]>();
  for (const s of sortSlots(slots)) {
    const k = `${s.start}–${s.end}`;
    groups.set(k, [...(groups.get(k) ?? []), s.weekday]);
  }
  return [...groups.entries()]
    .map(([time, days]) => `${days.map((d) => WEEKDAY_LABELS[d]).join(", ")} ${time}`)
    .join(" | ");
}

/** Lịch dạng chữ để ghi vào Excel: "T4 17:00-19:00; T7 17:00-19:00". */
export function scheduleToText(slots: ScheduleSlot[]): string {
  return sortSlots(slots)
    .map((s) => `${WEEKDAY_LABELS[s.weekday]} ${s.start}-${s.end}`)
    .join("; ");
}

/** Giờ học của ca, tính bằng giờ (ví dụ 2). */
export function slotHours(slot: Pick<ScheduleSlot, "start" | "end">): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return Math.max(0, toMin(slot.end) - toMin(slot.start)) / 60;
}

export interface TodaySession {
  classRoom: ClassRoom;
  slot: ScheduleSlot;
}

/** Các ca học của một ngày (theo thứ), sắp theo giờ bắt đầu. */
export function sessionsOnWeekday(classes: ClassRoom[], weekday: number): TodaySession[] {
  return classes
    .flatMap((c) => c.schedule.filter((s) => s.weekday === weekday).map((slot) => ({ classRoom: c, slot })))
    .sort((a, b) => a.slot.start.localeCompare(b.slot.start));
}
