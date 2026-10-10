# Hướng dẫn 2 — Đưa app lên mạng (Vercel, miễn phí) và cài vào điện thoại

Cần làm xong **Hướng dẫn 1 (Firebase)** trước và có sẵn đoạn `firebaseConfig`.
Nên làm trên **máy tính**. Tổng thời gian khoảng 15 phút.

---

## Phần A. Tạo tài khoản Vercel (nơi chạy app)
1. Mở **https://vercel.com/signup**
2. Chọn **Hobby** (miễn phí, dùng cá nhân) → ô tên: gõ tên cô → **Continue**.
3. Bấm **Continue with GitHub** → đăng nhập GitHub (tài khoản đang chứa code của app) → bấm **Authorize Vercel**.

## Phần B. Đưa code lên Vercel
1. Ở trang chính Vercel bấm **Add New…** (góc trên phải) → **Project**.
2. Mục **Import Git Repository** → tìm **L-p-h-c-v-n-H-V-n** → bấm **Import**.
   - Nếu không thấy: bấm **Adjust GitHub App Permissions** → chọn **Only select repositories** → chọn repo này → **Save** → quay lại.
3. Màn hình **Configure Project**:
   - **Project Name**: gõ `lop-van-co-ha-van` (đây sẽ là địa chỉ web: `lop-van-co-ha-van.vercel.app`).
   - **Framework Preset**: để nguyên **Next.js**.
   - Bấm mở mục **Environment Variables**.
4. Dán "mã kết nối" Firebase:
   - Bấm vào ô **Key** đầu tiên rồi **dán nguyên khối 6 dòng** em gửi cô (dạng `NEXT_PUBLIC_FIREBASE_API_KEY=...`).
     Vercel tự tách thành 6 dòng.
   - Nếu tự làm: mỗi dòng gồm Key (bên trái) và Value (bên phải):

     | Key | Value lấy từ firebaseConfig |
     |---|---|
     | `NEXT_PUBLIC_FIREBASE_API_KEY` | apiKey |
     | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | authDomain |
     | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | projectId |
     | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | storageBucket |
     | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
     | `NEXT_PUBLIC_FIREBASE_APP_ID` | appId |

     (chỉ chép phần chữ bên trong dấu ngoặc kép, không chép dấu `"`).
5. Bấm **Deploy** → chờ 2–3 phút đến khi hiện pháo hoa 🎉 **Congratulations!**
6. Bấm **Continue to Dashboard** → ô **Domains** ghi địa chỉ app, ví dụ `lop-van-co-ha-van.vercel.app`. Chép địa chỉ này.

## Phần C. Cho phép đăng nhập Google trên địa chỉ mới
1. Mở **https://console.firebase.google.com** → chọn dự án `lop-van-co-ha-van`.
2. **Build → Authentication** → tab **Cài đặt** (*Settings*) → mục **Miền được ủy quyền** (*Authorized domains*).
3. Bấm **Thêm miền** (*Add domain*) → dán `lop-van-co-ha-van.vercel.app` (không có `https://`) → **Thêm** (*Add*).

## Phần D. Mở app và nhập danh sách học sinh
1. Mở `https://lop-van-co-ha-van.vercel.app` → **Đăng nhập bằng Google** → chọn Gmail của cô.
2. Vào **Cài đặt → Chọn file Excel** → chọn file **"Danh sach hoc sinh - mau chuan.xlsx"** em đã gửi
   → kiểm tra số em từng lớp → bấm **Nhập 137 học sinh**.
   (Làm bước này trên máy tính cho tiện; điện thoại sẽ tự thấy dữ liệu.)

## Phần E. Cài app lên điện thoại (như app thật, có biểu tượng)
**iPhone (phải dùng Safari):**
1. Mở Safari → vào địa chỉ app → đăng nhập.
2. Bấm nút **Chia sẻ** (ô vuông có mũi tên lên, ở dưới màn hình).
3. Kéo xuống chọn **Thêm vào MH chính** (*Add to Home Screen*) → **Thêm**.

**Android (Chrome):**
1. Mở Chrome → vào địa chỉ app → đăng nhập.
2. Bấm **⋮** (góc trên phải) → **Cài đặt ứng dụng** hoặc **Thêm vào màn hình chính** → **Cài đặt**.

Từ giờ cô mở app bằng biểu tượng **Lớp Văn** trên màn hình điện thoại.

---

### Cập nhật về sau
Mỗi khi em làm xong giai đoạn mới và đưa code lên GitHub, Vercel **tự cập nhật app** sau 2–3 phút. Cô không cần làm gì.

### Nếu gặp lỗi
- Màn hình báo **"App chưa được kết nối Firebase"** → thiếu mã ở Phần B bước 4. Vào Vercel → dự án → **Settings → Environment Variables**
  kiểm tra đủ 6 dòng → sau đó **Deployments** → bấm **⋯** ở bản mới nhất → **Redeploy**.
- Đăng nhập báo lỗi / cửa sổ Google đóng ngay → chưa làm Phần C.
- Báo **"không có quyền vào app"** → đăng nhập nhầm tài khoản, hoặc email trong Quy tắc bảo mật (Hướng dẫn 1, Bước 4) chưa đúng.
