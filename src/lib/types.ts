/** Khối: tiểu học hoặc THCS 6–9. */
export type Grade = "TH" | "6" | "7" | "8" | "9";

/** Cách tính học phí của lớp. */
export type ClassFeeMode = "monthly" | "per_session";

/** Cách tính học phí riêng của học sinh. */
export type StudentFeeMethod = "monthly" | "odd_sessions" | "per_session";

export interface ScheduleSlot {
  /** 0 = Chủ nhật, 1 = Thứ 2, …, 6 = Thứ 7 (giống Date.getDay()). */
  weekday: number;
  /** "HH:mm" */
  start: string;
  end: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: Grade;
  schedule: ScheduleSlot[];
  feeMode: ClassFeeMode;
  order: number;
}

export type StudentStatus = "active" | "inactive";

export interface Student {
  /** Mã HS — cũng là id của document. */
  id: string;
  name: string;
  classId: string;
  grade: Grade;
  school: string;
  schoolClass: string;
  parentName: string;
  zalo: string;
  /** Luôn là chuỗi, giữ số 0 đầu. */
  phone: string;
  feeMethod: StudentFeeMethod;
  note: string;
  /** Ghi chú "Cần kiểm tra" do cô nhập (trống = không cần). */
  needsCheck: string;
  status: StudentStatus;
  /** % miễn giảm học phí (0–100). */
  discountPercent: number;
  updatedAt?: number;
}

// ───────────── Buổi học (Giai đoạn 2) ─────────────

/** Trạng thái điểm danh. "makeup" = Học bù (tính như có mặt). */
export type AttendanceStatus = "present" | "excused" | "unexcused" | "makeup";

/** Loại buổi: Chính thức / Bổ trợ (0đ) / Học bù. */
export type SessionType = "official" | "support" | "makeup";

export type Attitude = "good" | "chatting" | "distracted" | "lazy";

/** % bài tập về nhà. */
export type HomeworkPercent = 0 | 30 | 50 | 70 | 100;

export interface AttendanceRecord {
  status: AttendanceStatus;
  /** null = chưa chấm. */
  homework: HomeworkPercent | null;
  attitude: Attitude | null;
  /** Điểm theo từng phần kiểm tra, ví dụ { "Tập làm văn": 8, "Tiếng Việt": 9 }. */
  scores: Record<string, number>;
  tags: string[];
  note: string;
  /** Nhận xét buổi (Giai đoạn 3). */
  comment: string;
  /** Học sinh lớp khác đến học bù. */
  guest?: boolean;
}

export interface ClassSession {
  /** `${classId}_${YYYY-MM-DD}_${HHmm}` */
  id: string;
  classId: string;
  date: string;
  start: string;
  end: string;
  type: SessionType;
  /** Nghỉ cả lớp (cô cho nghỉ) — không tính học phí. */
  cancelled: boolean;
  content: string;
  homeworkText: string;
  /** Tên bài kiểm tra (trống = buổi không kiểm tra), ví dụ "KT 12/09". */
  testName: string;
  /** Các phần điểm, ví dụ ["Tập làm văn", "Tiếng Việt"] hoặc ["Điểm"]. */
  testParts: string[];
  records: Record<string, AttendanceRecord>;
  updatedAt?: number;
}

export interface AppSettings {
  commentTags: string[];
  /** Các kỳ thu tiền, mỗi kỳ là danh sách tháng (1–12), ví dụ [[9, 10], [11, 12], …]. */
  feePeriods: number[][];
}
