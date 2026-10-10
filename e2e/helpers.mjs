import { chromium } from "playwright";

export const BASE = process.env.BASE_URL ?? "http://localhost:3000";

export async function resetEmulators() {
  await fetch("http://127.0.0.1:8080/emulator/v1/projects/demo-lopvan/databases/(default)/documents", { method: "DELETE" });
  await fetch("http://127.0.0.1:9099/emulator/v1/projects/demo-lopvan/accounts", { method: "DELETE" });
}

export async function launch() {
  return chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
}

export async function mobileContext(browser) {
  return browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh", acceptDownloads: true,
  });
}

export async function login(page, email = "test@lopvan.local") {
  await page.goto(BASE);
  await page.getByLabel("Email thử").fill(email);
  await page.getByRole("button", { name: "Đăng nhập thử" }).click();
  await page.getByRole("link", { name: "Cài đặt" }).waitFor();
}

export async function importFile(page, file) {
  await page.getByRole("link", { name: "Cài đặt" }).click();
  await page.getByTestId("excel-input").setInputFiles(file);
  await page.getByRole("button", { name: /^Nhập \d+ học sinh$/ }).click();
  await page.getByText(/Đã nhập xong/).waitFor({ timeout: 30000 });
}
