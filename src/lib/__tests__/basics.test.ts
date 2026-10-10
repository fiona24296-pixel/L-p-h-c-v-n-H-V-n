import { describe, expect, it } from "vitest";
import { normalizePhone, phoneProblem } from "../phone";
import { formatSchedule, parseSchedule, sessionsOnWeekday, slotHours } from "../schedule";
import { DEFAULT_CLASSES } from "../defaults";
import { matchesSearch, removeDiacritics } from "../text";
import { stripAutoChecks, studentWarnings } from "../student-warnings";
import { todayISO, weekdayOf } from "../dates";

describe("SĐT", () => {
  it("bù số 0 bị Excel làm mất", () => {
    expect(normalizePhone(912345678)).toBe("0912345678");
    expect(normalizePhone("0381112222")).toBe("0381112222");
    expect(normalizePhone("0912 345.678")).toBe("0912345678");
    expect(normalizePhone("+84912345678")).toBe("0912345678");
    expect(normalizePhone(null)).toBe("");
  });
  it("phát hiện SĐT sai", () => {
    expect(phoneProblem("")).toBe("Thiếu SĐT");
    expect(phoneProblem("091234567")).toBe("SĐT có 9 số");
    expect(phoneProblem("5912345678")).toBe("SĐT không bắt đầu bằng số 0");
    expect(phoneProblem("0912345678")).toBeNull();
  });
});

describe("Lịch học", () => {
  it("đọc nhiều kiểu viết", () => {
    expect(parseSchedule("T4 17:00-19:00; T7 17:00-19:00")).toEqual([
      { weekday: 3, start: "17:00", end: "19:00" },
      { weekday: 6, start: "17:00", end: "19:00" },
    ]);
    expect(parseSchedule("T2, T6 17h-19h")).toEqual([
      { weekday: 1, start: "17:00", end: "19:00" },
      { weekday: 5, start: "17:00", end: "19:00" },
    ]);
    expect(parseSchedule("CN 8:00–10:00")).toEqual([{ weekday: 0, start: "08:00", end: "10:00" }]);
  });
  it("hiển thị gọn", () => {
    expect(formatSchedule(DEFAULT_CLASSES[1].schedule)).toBe("T4, T7 17:00–19:00");
    expect(slotHours({ start: "17:00", end: "19:00" })).toBe(2);
  });
  it("ca hôm nay theo thứ", () => {
    // Thứ 7: tiểu học 14h, Văn 6 17h
    expect(sessionsOnWeekday(DEFAULT_CLASSES, 6).map((s) => s.classRoom.id)).toEqual(["TH", "V6"]);
    // Thứ 2: Văn 7 17h, Văn 9.1 19h
    expect(sessionsOnWeekday(DEFAULT_CLASSES, 1).map((s) => s.classRoom.id)).toEqual(["V7", "V91"]);
    expect(sessionsOnWeekday(DEFAULT_CLASSES, 0)).toEqual([]);
  });
});

describe("Ngày giờ Việt Nam", () => {
  it("dùng múi giờ +7", () => {
    expect(todayISO(new Date("2026-10-10T18:30:00Z"))).toBe("2026-10-11");
    expect(weekdayOf("2026-10-10")).toBe(6);
  });
});

describe("Tìm kiếm & cảnh báo", () => {
  it("tìm không dấu", () => {
    expect(removeDiacritics("Đỗ Văn Đạt")).toBe("Do Van Dat");
    expect(matchesSearch(["Trần Thu Hà"], "thu ha")).toBe(true);
    expect(matchesSearch(["Trần Thu Hà"], "linh")).toBe(false);
  });
  it("bỏ mục app tự kiểm tra", () => {
    expect(stripAutoChecks("Thiếu SĐT; Thiếu tên phụ huynh")).toBe("");
    expect(stripAutoChecks("SĐT có 9 số, cần xem lại; Hỏi lại học phí")).toBe("Hỏi lại học phí");
    expect(studentWarnings({ phone: "", parentName: "", schoolClass: "6", needsCheck: "" })).toEqual([
      "Thiếu SĐT",
      "Thiếu tên phụ huynh",
    ]);
  });
});
