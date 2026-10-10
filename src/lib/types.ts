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
