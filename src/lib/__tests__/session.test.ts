import { describe, expect, it } from "vitest";
import { buildAttendanceMatrix } from "../attendance-export";
import { DEFAULT_CLASSES } from "../defaults";
import { periodOf, shiftPeriod } from "../periods";
import { scheduledDates } from "../schedule";
import {
  emptyRecord, formatScoreLine, homeworkColor, missingStudents, newSession, nextStatus, parseScore, sessionId, summarize,
} from "../session";
import type { Student } from "../types";

const st = (id: string, classId: string, status: Student["status"] = "active"): Student => ({
  id, name: `HS ${id}`, classId, grade: "6", school: "", schoolClass: "", parentName: "", zalo: "", phone: "",
  feeMethod: "monthly", note: "", needsCheck: "", status, discountPercent: 0,
});
const V6 = DEFAULT_CLASSES[1];

describe("Buổi học", () => {
  it("tạo buổi: cả lớp mặc định có mặt, bỏ em đã nghỉ và em lớp khác", () => {
    const s = newSession(V6, "2026-10-10", "17:00", "19:00", [st("V6-01", "V6"), st("V6-02", "V6", "inactive"), st("V7-01", "V7")]);
    expect(s.id).toBe("V6_2026-10-10_1700");
    expect(Object.keys(s.records)).toEqual(["V6-01"]);
    expect(s.records["V6-01"].status).toBe("present");
    expect(missingStudents(s, [st("V6-01", "V6"), st("V6-03", "V6")]).map((x) => x.id)).toEqual(["V6-03"]);
  });
  it("chạm đổi trạng thái theo vòng", () => {
    expect(nextStatus("present")).toBe("excused");
    expect(nextStatus("excused")).toBe("unexcused");
    expect(nextStatus("unexcused")).toBe("makeup");
    expect(nextStatus("makeup")).toBe("present");
  });
  it("đếm sĩ số", () => {
    const s = newSession(V6, "2026-10-10", "17:00", "19:00", [st("a", "V6"), st("b", "V6"), st("c", "V6")]);
    s.records.b.status = "excused";
    s.records.c.status = "makeup";
    expect(summarize(s)).toEqual({ total: 3, attending: 2, excused: 1, unexcused: 0, makeup: 1 });
  });
  it("màu BTVN và điểm", () => {
    expect([100, 70, 50, 30, 0, null].map(homeworkColor)).toEqual(["green", "green", "yellow", "red", "red", "none"]);
    expect(parseScore("8,5")).toBe(8.5);
    expect(parseScore("11")).toBeNull();
    expect(parseScore("")).toBeNull();
    expect(formatScoreLine({ testName: "KT 12/09", testParts: ["Tập làm văn", "Tiếng Việt"] }, { scores: { "Tập làm văn": 8, "Tiếng Việt": 9.5 } }))
      .toBe("KT 12/09 Tập làm văn: 8đ, Tiếng Việt: 9,5đ.");
    expect(formatScoreLine({ testName: "KT 15 phút", testParts: ["Điểm"] }, { scores: { "Điểm": 7 } })).toBe("KT 15 phút 7đ.");
    expect(formatScoreLine({ testName: "", testParts: [] }, { scores: {} })).toBe("");
  });
});

describe("Kỳ thu tiền", () => {
  it("T9–T10, T11–T12, T1–T2…", () => {
    expect(periodOf("2026-10-10")).toMatchObject({ id: "2026-09_2026-10", short: "T9-10", label: "Tháng 9 + 10/2026", from: "2026-09-01", to: "2026-10-31" });
    expect(periodOf("2027-02-15")).toMatchObject({ months: ["2027-01", "2027-02"], to: "2027-02-28" });
    expect(periodOf("2026-07-20")).toMatchObject({ months: ["2026-07"], short: "T7" });
    expect(shiftPeriod(periodOf("2026-12-01"), 1).short).toBe("T1-2");
    expect(shiftPeriod(periodOf("2027-01-05"), -1).id).toBe("2026-11_2026-12");
  });
  it("kỳ vắt qua năm", () => {
    expect(periodOf("2027-01-10", [[12, 1]])).toMatchObject({ months: ["2026-12", "2027-01"], label: "Tháng 12 + 1/2026-2027" });
  });
});

describe("Xuất Excel điểm danh", () => {
  it("* = có mặt, Vắng = vắng, - = chưa có, Nghỉ = nghỉ cả lớp", () => {
    const students = [st("V6-01", "V6"), st("V6-02", "V6"), st("V7-01", "V7")];
    const s1 = newSession(V6, "2026-09-12", "17:00", "19:00", students);
    s1.records["V6-02"].status = "unexcused";
    s1.records["V7-01"] = { ...emptyRecord("makeup"), guest: true };
    const s2 = newSession(V6, "2026-09-09", "17:00", "19:00", [students[0]]);
    const s3 = { ...newSession(V6, "2026-09-16", "17:00", "19:00", students), cancelled: true };
    const m = buildAttendanceMatrix([s1, s2, s3], students, "V6");
    expect(m.columns.map((c) => c.label)).toEqual(["09/09", "12/09", "16/09"]);
    expect(m.rows.map((r) => [r.student.id, ...r.cells, r.attended, r.absent])).toEqual([
      ["V6-01", "*", "*", "Nghỉ", 2, 0],
      ["V6-02", "-", "Vắng", "Nghỉ", 0, 1],
      ["V7-01", "-", "*", "Nghỉ", 1, 0],
    ]);
    expect(sessionId("V91", "2026-10-05", "19:00")).toBe("V91_2026-10-05_1900");
  });
});

describe("Lịch theo kỳ", () => {
  it("Văn 6 tháng 9/2026: các T4, T7", () => {
    const d = scheduledDates(DEFAULT_CLASSES[1], "2026-09-01", "2026-09-30").map((x) => x.date);
    expect(d).toEqual(["2026-09-02", "2026-09-05", "2026-09-09", "2026-09-12", "2026-09-16", "2026-09-19", "2026-09-23", "2026-09-26", "2026-09-30"]);
  });
});
