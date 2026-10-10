# Lớp Văn Cô Hạ Vân — ghi chú dự án

## Mục tiêu
Web app (PWA, dùng chủ yếu trên điện thoại) giúp cô giáo dạy thêm Ngữ văn quản lý 6 lớp / ~137 học sinh:
điểm danh nhanh, ghi buổi, nhận xét (có AI), tính học phí theo kỳ 2 tháng, làm phiếu báo (ảnh PNG + QR VietQR) gửi phụ huynh qua Zalo, theo dõi thu tiền.

Người dùng **không biết lập trình**: mọi giải thích, giao diện, thông báo lỗi đều bằng **tiếng Việt đơn giản**.
Khi cần cô thao tác (tạo tài khoản, lấy khóa, deploy) → hướng dẫn từng cú click.

## Cách làm việc
- Làm theo giai đoạn (bên dưới). Xong mỗi giai đoạn: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  chạy thử trên trình duyệt khổ điện thoại (Playwright, 390×844), chụp ảnh màn hình gửi cô, **chờ cô duyệt** rồi mới sang giai đoạn sau.
- Cập nhật mục "Tiến độ" ở cuối file này sau mỗi giai đoạn.
- Branch phát triển: `claude/lop-van-co-ha-van-wx8bx0`.

## Công nghệ
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS. Mobile-first. PWA (manifest + service worker).
- Firebase: Authentication (Google), Firestore (đồng bộ realtime, bật offline cache). Chỉ **1 email giáo viên** được vào
  (kiểm tra ở cả client và Firestore Security Rules: `request.auth.token.email == <email> && email_verified`).
- AI: Gemini API (gói miễn phí, model flash) gọi qua **Route Handler phía server** (`app/api/ai/...`).
  Khóa `GEMINI_API_KEY` chỉ nằm trong biến môi trường server, không bao giờ có tiền tố `NEXT_PUBLIC_`.
  API route xác thực Firebase ID token (verify JWT bằng `jose` + JWKS công khai của Google, không cần service account) và kiểm tra email.
- Excel: `exceljs` (đọc/ghi .xlsx). Ảnh phiếu: `html-to-image`. ZIP: `jszip`. QR: tự sinh chuỗi VietQR (EMVCo, có CRC16) + thư viện `qrcode`.
- Test: `vitest` cho các hàm thuần (tính học phí, VietQR, bỏ dấu, nhập Excel).
- Deploy: Vercel (gói Hobby miễn phí).

## Quy ước
- Font **Be Vietnam Pro** (next/font/google). Tông xanh dương nhạt / trắng, bo góc mềm (`rounded-2xl`), nút to (cao ≥ 48px), chữ ≥ 16px.
- Thanh điều hướng dưới: **Hôm nay / Lớp học / Học phí / Tổng quan / Cài đặt**.
- Tiền: số nguyên VNĐ, hiển thị `700.000đ`. Ngày lưu `YYYY-MM-DD`, hiển thị `dd/MM/yyyy`. Múi giờ `Asia/Ho_Chi_Minh`.
- SĐT luôn lưu dạng **chuỗi**, giữ số 0 đầu. "Mã HS" là khóa (= id document học sinh): nhập lại thì cập nhật, không tạo trùng.
- Logic nghiệp vụ (học phí, kỳ thu, QR, nhận xét) đặt trong `src/lib/` dạng hàm thuần, có test. UI không tự tính tiền.
- Mọi mức giá / kỳ thu / quy tắc / thẻ nhận xét / lịch lớp đọc từ `settings`, không viết cứng (chỉ có giá trị mặc định).
- Tên biến/hàm tiếng Anh; chữ hiển thị tiếng Việt.

## Mô hình dữ liệu Firestore (dự kiến)
- `settings/main`: thông tin GV, ngân hàng, câu cảm ơn, mức học phí, kỳ thu, quy tắc vắng, thẻ nhận xét.
- `classes/{classId}`: tên, khối (tieu_hoc | 6 | 7 | 8 | 9), lịch [{thứ, giờ bắt đầu, giờ kết thúc}], học phí theo tháng hay theo buổi.
- `students/{maHS}`: họ tên, classId, khối, trường, lớp ở trường, phụ huynh, zalo, sđt, cách tính học phí, ghi chú,
  cần kiểm tra, trạng thái (đang học / nghỉ học), % miễn giảm, ngày vào học.
- `sessions/{classId_YYYY-MM-DD_HHmm}`: lớp, ngày, giờ, loại (chinh_thuc | bo_tro | hoc_bu), nghỉ cả lớp, nội dung, BTVN,
  `records: { [maHS]: { status, btvn, yThuc, diem, the[], ghiChu, nhanXet } }`.
- `periodComments/{kỳ_maHS}`: nhận xét định kỳ.
- `roadmaps/{khối_YYYY-MM}`: lộ trình tháng theo khối.
- `fees/{kỳ_maHS}`: điều chỉnh tay (+/- tiền, lý do), trạng thái đóng, các lần đóng [{ngày, số tiền}].

## Lịch lớp mặc định
| Lớp | Lịch |
|---|---|
| Văn tiểu học | T7 14:00–16:00 |
| Văn 6 | T4, T7 17:00–19:00 |
| Văn 7 | T2, T6 17:00–19:00 |
| Văn 8 | T3, T5 19:00–21:00 |
| Văn 9.1 | T2, T4 19:00–21:00 |
| Văn 9.2 | T3, T5 17:00–19:00 |

## Học phí mặc định (sửa được trong Cài đặt)
- THCS: 700.000đ/tháng cố định. Buổi lẻ THCS: 90.000đ × số buổi thực học, tối đa 700.000đ/tháng.
- Tiểu học: 100.000đ/buổi × số buổi thực có học (buổi "Nghỉ cả lớp" không tính).
- "THCS vắng có trừ tiền": mặc định TẮT. Buổi Bổ trợ = 0đ.
- Thu 2 tháng/lần: T9–T10, T11–T12, T1–T2, T3–T4, T5–T6. Học phí kỳ = tổng 2 tháng, rồi áp % miễn giảm, rồi cộng điều chỉnh tay.
- Nội dung chuyển khoản: `HP T9-10 TEN HOC SINH LOP` (không dấu, in hoa).

## Kế hoạch giai đoạn
1. Khung app + đăng nhập Google + nhập Excel (sheet "Hoc sinh", "Lop hoc") + quản lý học sinh (thêm/sửa/xóa, chuyển lớp, nghỉ học, tìm, lọc, ⚠ cần kiểm tra).
2. Điểm danh & ghi buổi ("Ca học hôm nay", trạng thái, nghỉ cả lớp, nội dung/BTVN, % BTVN, ý thức, điểm, thẻ nhận xét, áp dụng cả lớp, xuất Excel điểm danh).
3. AI viết nhận xét (buổi + định kỳ, hàng loạt, sửa trước khi lưu).
4. Lộ trình theo khối, học phí, phiếu báo PNG, QR VietQR, ZIP cả lớp, tin nhắn Zalo.
5. Thu tiền, Tổng quan, Cài đặt đầy đủ, sao lưu/khôi phục (JSON + Excel).
6. Deploy Vercel + hướng dẫn cài PWA lên điện thoại.

## Tiến độ
- [ ] Giai đoạn 1 — đang chờ cô duyệt kế hoạch.
