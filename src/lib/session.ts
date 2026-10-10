import type {
  AttendanceRecord,
  AttendanceStatus,
  Attitude,
  ClassRoom,
  ClassSession,
  HomeworkPercent,
  SessionType,
  Student,
} from "./types";

export const STATUS_ORDER: AttendanceStatus[] = ["present", "excused", "unexcused", "makeup"];

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  excused: "Vắng có phép",
  unexcused: "Vắng không phép",
  makeup: "Học bù",
};

export const STATUS_SHORT: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  excused: "Vắng P",
  unexcused: "Vắng KP",
  makeup: "Học bù",
};

export const STATUS_STYLE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  excused: "bg-amber-50 text-amber-800 ring-amber-200",
  unexcused: "bg-red-50 text-red-700 ring-red-200",
  makeup: "bg-violet-50 text-violet-700 ring-violet-200",
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  official: "Chính thức",
  support: "Bổ trợ (0đ)",
  makeup: "Học bù",
};

export const ATTITUDE_LABELS: Record<Attitude, string> = {
  good: "Tốt",
  chatting: "Nói chuyện riêng",
  distracted: "Mất tập trung",
  lazy: "Lười học",
};

export const HOMEWORK_OPTIONS: HomeworkPercent[] = [0, 30, 50, 70, 100];

/** Màu % BTVN: xanh ≥70%, vàng 50%, đỏ ≤30%. */
export function homeworkColor(p: number | null): "green" | "yellow" | "red" | "none" {
  if (p === null || p === undefined) return "none";
  if (p >= 70) return "green";
  if (p >= 50) return "yellow";
  return "red";
}

export const HOMEWORK_STYLE = {
  green: "bg-emerald-100 text-emerald-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  none: "bg-slate-100 text-slate-500",
} as const;

export const DEFAULT_COMMENT_TAGS = [
  "Đọc hiểu tốt",
  "Nắm chắc kiến thức tiếng Việt",
  "Viết đoạn mạch lạc",
  "Bài viết còn lan man",
  "Diễn đạt chưa trôi chảy",
  "Dùng từ chưa chính xác",
  "Sai chính tả",
  "Chưa đúng bố cục",
  "Thiếu dẫn chứng",
  "Thiếu liên kết",
  "Có sáng tạo",
  "Chữ viết cẩu thả",
  "Tích cực phát biểu",
  "Chưa học bài cũ",
  "Quên vở",
];

/** Có mặt (kể cả học bù) — dùng cho tính học phí, xuất Excel. */
export function isAttending(status: AttendanceStatus): boolean {
  return status === "present" || status === "makeup";
}

export function nextStatus(s: AttendanceStatus): AttendanceStatus {
  return STATUS_ORDER[(STATUS_ORDER.indexOf(s) + 1) % STATUS_ORDER.length];
}

export function sessionId(classId: string, date: string, start: string): string {
  return `${classId}_${date}_${start.replace(":", "")}`;
}

export function emptyRecord(status: AttendanceStatus = "present"): AttendanceRecord {
  return { status, homework: null, attitude: null, scores: {}, tags: [], note: "", comment: "" };
}

/** Chuẩn hóa dữ liệu buổi đọc từ Firestore (thiếu trường thì lấy mặc định). */
export function toSession(id: string, data: Partial<ClassSession>): ClassSession {
  const records: Record<string, AttendanceRecord> = {};
  for (const [sid, r] of Object.entries(data.records ?? {})) records[sid] = { ...emptyRecord(), ...r };
  return {
    id,
    classId: data.classId ?? "",
    date: data.date ?? "",
    start: data.start ?? "",
    end: data.end ?? "",
    type: data.type ?? "official",
    cancelled: data.cancelled ?? false,
    content: data.content ?? "",
    homeworkText: data.homeworkText ?? "",
    testName: data.testName ?? "",
    testParts: data.testParts ?? [],
    records,
    updatedAt: data.updatedAt,
  };
}

/** Phần điểm mặc định khi bật "Có kiểm tra": tiểu học chấm 2 phần như cô vẫn làm. */
export function defaultTestParts(classRoom?: ClassRoom): string[] {
  return classRoom?.grade === "TH" ? ["Tập làm văn", "Tiếng Việt"] : ["Điểm"];
}

/** Buổi mới: cả lớp (học sinh đang học) mặc định Có mặt. */
export function newSession(
  classRoom: ClassRoom,
  date: string,
  start: string,
  end: string,
  students: Student[],
  type: SessionType = "official",
): ClassSession {
  const records: Record<string, AttendanceRecord> = {};
  for (const s of students) if (s.classId === classRoom.id && s.status === "active") records[s.id] = emptyRecord();
  return {
    id: sessionId(classRoom.id, date, start),
    classId: classRoom.id,
    date, start, end, type,
    cancelled: false, content: "", homeworkText: "", testName: "", testParts: [],
    records,
  };
}

/** Học sinh đang học của lớp nhưng chưa có trong buổi (ví dụ mới vào lớp sau khi buổi được tạo). */
export function missingStudents(session: ClassSession, students: Student[]): Student[] {
  return students.filter((s) => s.classId === session.classId && s.status === "active" && !session.records[s.id]);
}

export interface SessionSummary {
  total: number;
  attending: number;
  excused: number;
  unexcused: number;
  makeup: number;
}

export function summarize(session: Pick<ClassSession, "records">): SessionSummary {
  const sum: SessionSummary = { total: 0, attending: 0, excused: 0, unexcused: 0, makeup: 0 };
  for (const r of Object.values(session.records)) {
    sum.total++;
    if (isAttending(r.status)) sum.attending++;
    if (r.status === "excused") sum.excused++;
    if (r.status === "unexcused") sum.unexcused++;
    if (r.status === "makeup") sum.makeup++;
  }
  return sum;
}

/** "KT 12/09 Tập làm văn: 8đ, Tiếng Việt: 9,5đ." — dòng điểm như cô vẫn ghi. */
export function formatScoreLine(session: Pick<ClassSession, "testName" | "testParts">, rec: Pick<AttendanceRecord, "scores">): string {
  if (!session.testName) return "";
  const parts = session.testParts
    .filter((p) => rec.scores[p] !== undefined && rec.scores[p] !== null)
    .map((p) => `${p === "Điểm" ? "" : `${p}: `}${String(rec.scores[p]).replace(".", ",")}đ`);
  if (!parts.length) return "";
  return `${session.testName} ${parts.join(", ")}.`;
}

/** Đọc ô điểm cô gõ: "8,5" / "8.5" → 8.5; ngoài 0–10 hoặc trống → null. */
export function parseScore(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 10) return null;
  return Math.round(n * 100) / 100;
}
