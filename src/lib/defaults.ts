import type { ClassRoom } from "./types";

/** 6 lớp mặc định theo lịch của cô (sửa được trong Cài đặt / file Excel). */
export const DEFAULT_CLASSES: ClassRoom[] = [
  { id: "TH", name: "Văn tiểu học", grade: "TH", feeMode: "per_session", order: 1,
    schedule: [{ weekday: 6, start: "14:00", end: "16:00" }] },
  { id: "V6", name: "Văn 6", grade: "6", feeMode: "monthly", order: 2,
    schedule: [{ weekday: 3, start: "17:00", end: "19:00" }, { weekday: 6, start: "17:00", end: "19:00" }] },
  { id: "V7", name: "Văn 7", grade: "7", feeMode: "monthly", order: 3,
    schedule: [{ weekday: 1, start: "17:00", end: "19:00" }, { weekday: 5, start: "17:00", end: "19:00" }] },
  { id: "V8", name: "Văn 8", grade: "8", feeMode: "monthly", order: 4,
    schedule: [{ weekday: 2, start: "19:00", end: "21:00" }, { weekday: 4, start: "19:00", end: "21:00" }] },
  { id: "V91", name: "Văn 9.1", grade: "9", feeMode: "monthly", order: 5,
    schedule: [{ weekday: 1, start: "19:00", end: "21:00" }, { weekday: 3, start: "19:00", end: "21:00" }] },
  { id: "V92", name: "Văn 9.2", grade: "9", feeMode: "monthly", order: 6,
    schedule: [{ weekday: 2, start: "17:00", end: "19:00" }, { weekday: 4, start: "17:00", end: "19:00" }] },
];

export const GRADE_LABELS: Record<string, string> = {
  TH: "Tiểu học", "6": "Khối 6", "7": "Khối 7", "8": "Khối 8", "9": "Khối 9",
};

export const FEE_METHOD_LABELS = {
  monthly: "Theo tháng",
  odd_sessions: "Buổi lẻ",
  per_session: "Theo buổi",
} as const;
