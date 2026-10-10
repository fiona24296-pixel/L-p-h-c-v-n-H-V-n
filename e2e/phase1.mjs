// Chạy thử giai đoạn 1 trên khổ điện thoại (cần emulator + `next dev` với NEXT_PUBLIC_USE_EMULATOR=1).
// Cách dùng: node e2e/phase1.mjs [thư-mục-ảnh]   (tự tạo file Excel giả để nhập)
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { makeFixture } from "./make-fixture.mjs";

const [outDir = "screenshots"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const file = await makeFixture(`${outDir}/du-lieu-gia.xlsx`);
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
const page = await ctx.newPage();
const errors = [];
let collect = true; // tắt ở bước giả lập lùi giờ cuối kịch bản (Firestore sẽ cảnh báo giờ lệch — bình thường)
page.on("console", (m) => collect && m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
const shot = (name) => page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
const step = (s) => console.log("•", s);

// Xóa dữ liệu emulator để chạy lại từ đầu.
await fetch("http://127.0.0.1:8080/emulator/v1/projects/demo-lopvan/databases/(default)/documents", { method: "DELETE" });
await fetch("http://127.0.0.1:9099/emulator/v1/projects/demo-lopvan/accounts", { method: "DELETE" });
await page.goto(BASE);
await page.getByText("Đăng nhập bằng Google").waitFor();
await shot("01-dang-nhap");

step("Email lạ bị chặn");
await page.getByLabel("Email thử").fill("nguoila@gmail.com");
await page.getByRole("button", { name: "Đăng nhập thử" }).click();
await page.getByText("không có quyền vào app").waitFor();
await shot("02-email-la-bi-chan");

step("Đăng nhập đúng email");
await page.getByLabel("Email thử").fill("test@lopvan.local");
await page.getByRole("button", { name: "Đăng nhập thử" }).click();
await page.getByRole("heading", { name: "Ca học hôm nay" }).waitFor();
await page.waitForTimeout(800);
await shot("03-hom-nay-truoc-khi-nhap");

step("Nhập Excel");
await page.getByRole("link", { name: "Cài đặt" }).click();
await page.getByRole("heading", { name: "Nhập từ Excel" }).waitFor();
await page.getByTestId("excel-input").setInputFiles(file);
await page.getByRole("button", { name: /^Nhập \d+ học sinh$/ }).waitFor();
await shot("04-xem-truoc-nhap");
const label = await page.getByRole("button", { name: /^Nhập \d+ học sinh$/ }).textContent();
step(label);
await page.getByRole("button", { name: /^Nhập \d+ học sinh$/ }).click();
await page.getByText(/Đã nhập xong/).waitFor({ timeout: 30000 });
step(await page.getByText(/Đã nhập xong/).textContent());
await shot("05-nhap-xong");

step("Nhập lại lần 2 không bị trùng");
await page.getByTestId("excel-input").setInputFiles(file);
await page.getByRole("button", { name: /^Nhập \d+ học sinh$/ }).waitFor();
await page.getByRole("button", { name: /^Nhập \d+ học sinh$/ }).click();
await page.getByText(/Đã nhập xong/).waitFor({ timeout: 30000 });
step(await page.getByText(/Đã nhập xong/).textContent());

step("Danh sách lớp");
await page.getByRole("link", { name: "Lớp học" }).click();
await page.getByText(/học sinh đang học/).waitFor();
await page.waitForTimeout(500);
await shot("06-lop-hoc-tat-ca");
await page.getByRole("button", { name: /^Văn tiểu học/ }).click();
await page.waitForTimeout(400);
await shot("07-lop-tieu-hoc");
await page.getByRole("button", { name: /^⚠ Cần kiểm tra/ }).click();
await page.waitForTimeout(400);
await shot("08-can-kiem-tra");
step(await page.getByText(/^\d+ học sinh$/).textContent());

step("Tìm kiếm không dấu");
await page.getByRole("button", { name: /^Tất cả/ }).click();
await page.getByRole("button", { name: /^Đang học$/ }).click();
await page.getByPlaceholder(/Tìm tên/).fill("ngo bao ngoc");
await page.waitForTimeout(400);
await shot("09-tim-kiem");
step(await page.getByText(/^\d+ học sinh$/).textContent());

step("Sửa học sinh: bổ sung SĐT");
await page.getByPlaceholder(/Tìm tên/).fill("Ly Minh Khoa");
await page.getByText("Lý Minh Khoa").click();
await page.getByRole("dialog").waitFor();
await shot("10-sua-hoc-sinh");
await page.getByLabel("SĐT phụ huynh").fill("0912 345 678");
await page.getByRole("button", { name: "Lưu", exact: true }).click();
await page.getByText("Đã lưu Lý Minh Khoa").waitFor();
await shot("11-da-luu");

step("Chuyển lớp + nghỉ học");
await page.getByPlaceholder(/Tìm tên/).fill("Dinh Thu Mai");
await page.getByText("Đinh Thu Mai", { exact: true }).click();
await page.getByLabel("Lớp học thêm").selectOption("V6");
await page.getByRole("button", { name: "Lưu", exact: true }).click();
await page.getByText(/Đã chuyển Đinh Thu Mai sang Văn 6/).waitFor();
await page.getByText("Đinh Thu Mai", { exact: true }).click();
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: "Lưu", exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: /^Đã nghỉ$/ }).click();
await page.getByText("Đinh Thu Mai", { exact: true }).waitFor();
step("Đinh Thu Mai đã ở mục Đã nghỉ");

step("Thêm học sinh mới");
await page.getByRole("button", { name: "Thêm học sinh" }).click();
await page.getByLabel("Họ tên").fill("Học Sinh Thử");
await page.getByLabel("Lớp học thêm").selectOption("V92");
step("Mã tự tạo: " + (await page.getByLabel("Mã HS").inputValue()));
await shot("12-them-hoc-sinh");
await page.getByRole("button", { name: "Lưu", exact: true }).click();
await page.getByText("Đã thêm Học Sinh Thử").waitFor();

step("Xóa học sinh");
await page.getByRole("button", { name: /^Đang học$/ }).click();
await page.getByPlaceholder(/Tìm tên/).fill("Học Sinh Thử");
await page.getByText("Học Sinh Thử", { exact: true }).click();
await page.getByRole("button", { name: "Xóa học sinh" }).click();
await page.getByRole("button", { name: "Xóa", exact: true }).click();
await page.getByText("Đã xóa Học Sinh Thử").waitFor();

step("Hôm nay sau khi nhập");
await page.getByRole("link", { name: "Hôm nay" }).click();
await page.waitForTimeout(600);
await shot("13-hom-nay");
await page.getByRole("link", { name: "Học phí" }).click();
await page.waitForTimeout(300);
await shot("14-hoc-phi");
await page.getByRole("link", { name: "Cài đặt" }).click();
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await shot("15-cai-dat");

step("Hôm nay lúc có ca (giả lập Thứ 7, 17:30)");
const errorsBeforeClock = [...errors];
collect = false;
const p2 = await ctx.newPage();
await p2.clock.setFixedTime(new Date("2026-10-10T10:30:00Z"));
await p2.goto(BASE);
await p2.getByText("Văn 6").first().waitFor();
await p2.waitForTimeout(500);
await p2.screenshot({ path: `${outDir}/16-hom-nay-co-ca.png` });

console.log("Lỗi trên trình duyệt:", errorsBeforeClock.length ? errorsBeforeClock : "không có");
await browser.close();
