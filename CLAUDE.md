# Lớp Văn Cô Hạ Vân — ghi chú dự án

## Mục tiêu
Web app (PWA, dùng chủ yếu trên điện thoại) giúp cô giáo dạy thêm Ngữ văn quản lý 6 lớp / ~137 học sinh:
điểm danh nhanh, ghi buổi, nhận xét (có AI), tính học phí theo kỳ 2 tháng, làm phiếu báo (ảnh PNG + QR VietQR) gửi phụ huynh qua Zalo, theo dõi thu tiền.

Người dùng **không biết lập trình**: mọi giải thích, giao diện, thông báo lỗi đều bằng **tiếng Việt đơn giản**.
Khi cần cô thao tác (tạo tài khoản, lấy khóa, deploy) → hướng dẫn từng cú click.

## ⚠ Quyền riêng tư — repo GitHub đang CÔNG KHAI
- **Không bao giờ commit dữ liệu học sinh thật** (tên, SĐT, phụ huynh, file .xlsx của cô). `.gitignore` đã chặn `*.xlsx`.
- Không ghi email giáo viên vào code/commit. Security Rules dùng chỗ giữ chỗ `__TEACHER_EMAIL__`;
  bản có email thật tạo bằng `node scripts/make-rules.mjs <email>` rồi gửi cô dán vào Firebase Console.
- Test/e2e chỉ dùng dữ liệu giả (`e2e/make-fixture.mjs`).

## Cách làm việc
- Làm theo giai đoạn (bên dưới). Xong mỗi giai đoạn: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  chạy thử trên trình duyệt khổ điện thoại (Playwright, 390×844), chụp ảnh màn hình gửi cô, **chờ cô duyệt** rồi mới sang giai đoạn sau.
- Cập nhật mục "Tiến độ" ở cuối file này sau mỗi giai đoạn.
- Branch phát triển: `claude/lop-van-co-ha-van-wx8bx0`.
- Next.js 16.4 có thay đổi so với kiến thức cũ — đọc `node_modules/next/dist/docs/` trước khi dùng API lạ (xem AGENTS.md).
- Chạy thử trên máy: `npm run emulators` (Firebase Auth + Firestore giả lập, cần Java) rồi `next dev` với
  `.env.local` có `NEXT_PUBLIC_USE_EMULATOR=1` → màn đăng nhập có nút "Đăng nhập thử" (email `test@lopvan.local`).
  Kịch bản kiểm thử giao diện: `CHROMIUM_PATH=... node e2e/phase1.mjs <thư-mục-ảnh>`.

## Công nghệ
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS. Mobile-first. PWA (manifest + service worker).
- Firebase: Authentication (Google), Firestore (đồng bộ realtime, bật offline cache). Chỉ **1 email giáo viên** được vào
  (kiểm tra ở cả client và Firestore Security Rules: `request.auth.token.email == <email> && email_verified`).
- AI: Gemini API (gói miễn phí, model flash) gọi qua **Route Handler phía server** (`app/api/ai/...`).
  Khóa `GEMINI_API_KEY` chỉ nằm trong biến môi trường server, không bao giờ có tiền tố `NEXT_PUBLIC_`.
  API route xác thực Firebase ID token (verify JWT bằng `jose` + JWKS công khai của Google, không cần service account) và kiểm tra email.
- Excel: `exceljs` (đọc/ghi .xlsx, import động để không làm nặng app). Ảnh phiếu: `html-to-image`. ZIP: `jszip`. QR: tự sinh chuỗi VietQR (EMVCo, có CRC16) + thư viện `qrcode`.
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

## File Excel
- Mẫu chuẩn: sheet **"Hoc sinh"** (12 cột như yêu cầu) + **"Lop hoc"** (Mã lớp | Tên lớp | Khối | Lịch học | Cách tính học phí),
  lịch dạng `T4 17:00-19:00; T7 17:00-19:00`. Đọc: `src/lib/excel-import.ts`; ghi: `src/lib/excel-export.ts`.
- File gốc của cô KHÁC mẫu: mỗi lớp 1 sheet (TH, V6, V7, V8, V9.1, V9.2), mỗi sheet có 4 khối:
  danh sách (STT | Tên | Trường | Lớp | PH | Zalo | SĐT | Ghi chú), bảng điểm danh (cột là ngày, "*" có mặt, "Vắng", "-"),
  bảng nhận xét, bảng đóng tiền theo tháng ("X" = đã đóng?). Không có Mã HS, SĐT hay bị mất số 0.
  Đã chuyển 1 lần sang mẫu chuẩn (137 em), mã HS dạng `TH-01`, `V6-01`, `V91-01`, `V92-01`… Mã lớp: TH, V6, V7, V8, V91, V92.
- Ô "Cần kiểm tra": app tự phát hiện thiếu SĐT / SĐT sai / thiếu tên PH / thiếu lớp ở trường (`student-warnings.ts`)
  nên khi nhập sẽ bỏ các mục đó khỏi ô, chỉ giữ ghi chú riêng của cô → bổ sung xong thì ⚠ tự mất.
- Văn phong nhận xét mẫu của cô: `docs/van-phong-nhan-xet.md` (dùng cho Giai đoạn 3).

## Mô hình dữ liệu Firestore
- `settings/main`: commentTags (đã có), feePeriods (đã có); sắp tới: thông tin GV, ngân hàng, câu cảm ơn, mức học phí, kỳ thu, quy tắc vắng, thẻ nhận xét.
- `classes/{classId}`: tên, khối (tieu_hoc | 6 | 7 | 8 | 9), lịch [{thứ, giờ bắt đầu, giờ kết thúc}], học phí theo tháng hay theo buổi.
- `students/{maHS}`: họ tên, classId, khối, trường, lớp ở trường, phụ huynh, zalo, sđt, cách tính học phí, ghi chú,
  cần kiểm tra, trạng thái (đang học / nghỉ học), % miễn giảm, ngày vào học.
- `sessions/{classId_YYYY-MM-DD_HHmm}`: classId, date, start, end, type (official | support | makeup), cancelled,
  content, homeworkText, testName (trống = không KT), testParts (["Tập làm văn","Tiếng Việt"] / ["Điểm"]),
  `records: { [maHS]: { status (present|excused|unexcused|makeup), homework (0|30|50|70|100|null), attitude, scores{phần: điểm}, tags[], note, comment, guest? } }`.
  Ghi từng phần bằng `setDoc(merge)` (`patchSession`) để 2 máy sửa 2 em khác nhau không đè nhau.
  Truy vấn theo lớp + khoảng ngày dùng `documentId()` range (không cần composite index).
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
- [x] Giai đoạn 1 — khung app, đăng nhập Google (kiểm tra quyền bằng cách đọc thử `settings/main`: Rules từ chối → đăng xuất,
  báo "không có quyền"), PWA (manifest + `public/sw.js`), nhập Excel (xem trước → nhập, upsert theo Mã HS),
  danh sách học sinh (lọc lớp, tìm không dấu, ⚠ cần kiểm tra, đã nghỉ), thêm/sửa/xóa/chuyển lớp/nghỉ học,
  Hôm nay (ca theo lịch), Cài đặt (nhập/tải Excel, lịch lớp, đăng xuất). **Chờ cô duyệt + tạo Firebase.**
- [x] Giai đoạn 2 — `/diem-danh?lop=&ngay=&gio=` (mở ca lần đầu tự tạo buổi, cả lớp Có mặt; chạm ô trạng thái để đổi vòng
  Có mặt → Vắng P → Vắng KP → Học bù; Nghỉ cả lớp; loại buổi; nội dung + BTVN; bài KT nhiều phần điểm; bảng chi tiết từng em
  có Em trước/Em sau; Áp dụng cho cả lớp (chỉ em có mặt); sửa thẻ; thêm HS lớp khác học bù; em mới vào lớp → nút "Thêm vào"),
  `/buoi-hoc?lop=` (buổi theo kỳ 2 tháng, gộp lịch chưa điểm danh, thêm buổi khác lịch, xuất Excel "*"/"Vắng"/"-"/"Nghỉ").
  Hôm nay hiện "Đã điểm danh: có mặt x/y". Kiểm thử: `e2e/phase2.mjs` (có kiểm tra đồng bộ 2 máy). **Chờ cô duyệt.**
- Ghi theo kiểu "lạc quan": ghi vào bộ nhớ đệm Firestore rồi đóng form ngay (mạng yếu vẫn dùng được).
- Câu hỏi còn chờ cô trả lời: email đăng nhập (đang giả định Gmail của tài khoản Claude của cô — không ghi vào repo), quy tắc "buổi lẻ" THCS,
  "Học bù" tính như có mặt?, Vercel, có deploy sớm để thử trên điện thoại không.
