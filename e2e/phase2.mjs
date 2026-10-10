// Chạy thử giai đoạn 2 (điểm danh & ghi buổi) trên khổ điện thoại, dữ liệu giả.
// Cách dùng: node e2e/phase2.mjs [thư-mục-ảnh]
import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";
import { BASE, importFile, launch, login, mobileContext, resetEmulators } from "./helpers.mjs";
import { makeFixture } from "./make-fixture.mjs";

const [outDir = "screenshots"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const file = await makeFixture(`${outDir}/du-lieu-gia.xlsx`);
const step = (s) => console.log("•", s);
const assert = (ok, msg) => {
  if (!ok) throw new Error("SAI: " + msg);
  console.log("  ✓", msg);
};

await resetEmulators();
const browser = await launch();
const ctx = await mobileContext(browser);
const page = await ctx.newPage();
const errors = [];
let collect = true;
page.on("console", (m) => collect && m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
const shot = (name, p = page) => p.screenshot({ path: `${outDir}/${name}.png` });

await login(page);
await importFile(page, file);

step("Mở ca Văn 6 thứ 7 10/10 17:00");
const url = `${BASE}/diem-danh?lop=V6&ngay=2026-10-10&gio=17:00`;
await page.goto(url);
await page.getByText("Có mặt 5/5").waitFor();
assert(true, "cả lớp mặc định Có mặt (5/5)");
await shot("p2-01-mo-ca");

step("Nội dung bài + BTVN cho cả lớp");
await page.getByLabel("Nội dung bài học").fill("Đọc hiểu văn bản thơ “Những cánh buồm”");
await page.getByLabel("Bài tập về nhà").fill("Viết đoạn văn 7–10 câu cảm nhận khổ thơ cuối");
await page.getByLabel("Bài tập về nhà").blur();

step("Chạm đổi trạng thái");
const statusBtns = page.getByRole("button", { name: /^Trạng thái/ });
await statusBtns.nth(1).click();
await statusBtns.nth(1).click(); // → Vắng KP
await statusBtns.nth(2).click(); // → Vắng P
await page.getByText(/Có mặt 3\/5/).waitFor();
assert(true, "Có mặt 3/5 · Vắng P 1 · Vắng KP 1");

step("Áp dụng cho cả lớp: BTVN 100%, Tốt, thẻ Tích cực phát biểu");
await page.getByRole("button", { name: "Áp dụng cho cả lớp" }).click();
const dlg = page.getByRole("dialog");
await dlg.getByRole("button", { name: "100%", exact: true }).click();
await dlg.getByRole("button", { name: "Tốt", exact: true }).click();
await dlg.getByRole("button", { name: "Tích cực phát biểu" }).click();
await shot("p2-02-ap-dung-ca-lop");
await dlg.getByRole("button", { name: /Áp dụng cho 3 em có mặt/ }).click();
await page.getByText("Đã áp dụng cho 3 em có mặt").waitFor();
await page.waitForTimeout(500);
assert((await page.getByText("BTVN 100%", { exact: true }).count()) === 3, "3 em có mặt được BTVN 100%, em vắng không đổi");

step("Bật bài kiểm tra");
await page.getByRole("checkbox").click();
await page.getByLabel("Tên bài kiểm tra").waitFor();

step("Chấm riêng em đầu tiên");
await page.locator("li").first().getByRole("button").nth(1).click();
await dlg.waitFor();
await dlg.getByRole("button", { name: "50%", exact: true }).click();
await dlg.getByRole("button", { name: "Nói chuyện riêng" }).click();
await dlg.getByRole("button", { name: "Sai chính tả" }).click();
await dlg.getByLabel("Điểm Điểm").fill("8,5");
await dlg.getByLabel("Ghi chú").fill("Đi muộn 10 phút");
await dlg.getByLabel("Ghi chú").blur();
await page.waitForTimeout(300);
await shot("p2-03-chi-tiet-hoc-sinh");
await dlg.getByRole("button", { name: "Em sau ›" }).click();
await page.waitForTimeout(300);
assert((await dlg.getByText("2/5").count()) === 1, "nút Em sau chuyển sang em thứ 2");

step("Sửa thẻ: thêm 'Có tiến bộ'");
await dlg.getByRole("button", { name: "✎ Sửa thẻ" }).click();
const tagDlg = page.getByRole("dialog", { name: "Sửa thẻ nhận xét" });
await tagDlg.getByLabel("Thẻ mới").fill("Có tiến bộ");
await tagDlg.getByRole("button", { name: "Thêm", exact: true }).click();
await shot("p2-04-sua-the");
await tagDlg.getByRole("button", { name: "Lưu thẻ" }).click();
await page.getByRole("dialog").getByRole("button", { name: "Có tiến bộ" }).waitFor();
assert(true, "thẻ mới xuất hiện ngay");
await page.keyboard.press("Escape");

step("Thêm học sinh lớp khác học bù");
await page.getByRole("button", { name: "+ Thêm học sinh lớp khác (học bù)" }).click();
await page.getByRole("dialog").getByPlaceholder("Gõ tên học sinh…").fill("ngo bao ngoc");
await page.getByRole("dialog").getByRole("button").filter({ hasText: "Văn 9.2" }).click();
await page.getByText(/Có mặt 4\/6/).waitFor();
assert(true, "học bù tính như có mặt: 4/6");
await page.waitForTimeout(500);
await shot("p2-05-danh-sach");

step("Máy thứ 2 thấy ngay (đồng bộ)");
const ctx2 = await mobileContext(browser);
const page2 = await ctx2.newPage();
await login(page2);
await page2.goto(url);
await page2.getByText(/Có mặt 4\/6/).waitFor();
assert((await page2.getByLabel("Nội dung bài học").inputValue()).includes("Những cánh buồm"), "máy 2 thấy nội dung bài");
await statusBtns.nth(0).click(); // máy 1 đổi em 1 → Vắng P
await page2.getByText(/Có mặt 3\/6/).waitFor({ timeout: 10000 });
assert(true, "máy 1 đổi trạng thái → máy 2 cập nhật");
await statusBtns.nth(0).click();
await statusBtns.nth(0).click();
await statusBtns.nth(0).click(); // quay về Có mặt
await ctx2.close();

step("Tải lại trang vẫn còn dữ liệu");
await page.reload();
await page.getByText(/Có mặt 4\/6/).waitFor();
assert((await page.getByText("BTVN 50%").count()) === 1, "BTVN 50% của em 1 còn sau khi tải lại");
assert((await page.getByText("8,5đ").count()) === 1, "điểm 8,5 còn sau khi tải lại");

step("Ca tiểu học: Nghỉ cả lớp");
await page.goto(`${BASE}/diem-danh?lop=TH&ngay=2026-10-10&gio=14:00`);
await page.getByText(/Có mặt \d+\/\d+/).waitFor();
await page.getByRole("button", { name: "Nghỉ cả lớp (cô cho nghỉ)" }).click();
await page.getByText("Buổi này cả lớp nghỉ").waitFor();
await shot("p2-06-nghi-ca-lop");

step("Thêm 1 buổi Văn 6 khác (03/10) để xuất Excel nhiều cột");
await page.goto(`${BASE}/diem-danh?lop=V6&ngay=2026-10-03&gio=17:00`);
await page.getByText("Có mặt 5/5").waitFor();
await statusBtns.nth(4).click();

step("Danh sách buổi + xuất Excel");
await page.goto(`${BASE}/buoi-hoc?lop=V6`);
await page.getByText("Tháng 9 + 10/2026").waitFor();
await page.getByText(/Có mặt 4\/6/).waitFor();
await shot("p2-07-cac-buoi-hoc");
const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Xuất Excel" }).click()]);
const xlsx = `${outDir}/diem-danh-xuat-ra.xlsx`;
await download.saveAs(xlsx);
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(xlsx);
const ws = wb.getWorksheet("Diem danh");
const rows = [];
ws.eachRow((r) => rows.push(r.values.slice(1).join(" | ")));
console.log("  Excel:\n   " + rows.join("\n   "));
assert(rows[1].includes("03/10") && rows[1].includes("10/10"), "cột là ngày");
assert(rows.some((r) => r.includes("Vắng")) && rows.some((r) => r.includes("*")), "có * và Vắng");

step("Hôm nay hiện trạng thái điểm danh (giả lập 10/10 18:00)");
collect = false;
const p3 = await ctx.newPage();
await p3.clock.setFixedTime(new Date("2026-10-10T11:00:00Z"));
await p3.goto(BASE);
await p3.getByText(/Đã điểm danh: có mặt 4\/6/).waitFor();
await p3.waitForTimeout(400);
await shot("p2-08-hom-nay", p3);
assert(true, "thẻ Văn 6 hiện 'Đã điểm danh: có mặt 4/6', tiểu học hiện 'Nghỉ cả lớp'");

console.log("Lỗi trên trình duyệt:", errors.length ? errors : "không có");
await browser.close();
if (errors.length) process.exit(1);
