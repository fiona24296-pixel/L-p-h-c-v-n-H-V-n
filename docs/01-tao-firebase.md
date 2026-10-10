# Hướng dẫn 1 — Tạo dự án Firebase (khoảng 10 phút)

Firebase là nơi lưu dữ liệu của app (danh sách học sinh, điểm danh…) và lo việc đăng nhập Google.
Gói miễn phí (Spark) là đủ dùng cho lớp của cô. **Không cần nhập thẻ ngân hàng.**

> Mẹo: làm trên **máy tính** sẽ dễ hơn điện thoại. Nếu trình duyệt hiện tiếng Anh, em ghi tên nút tiếng Anh trong ngoặc.

## Bước 1. Tạo dự án
1. Mở trang **https://console.firebase.google.com**
2. Đăng nhập bằng **tài khoản Gmail của cô** (chính tài khoản sẽ dùng để vào app).
3. Bấm **Tạo dự án** (*Create a project* / *Get started with a Firebase project*).
4. Ô tên dự án: gõ `lop-van-co-ha-van` → tick ô đồng ý điều khoản → **Tiếp tục** (*Continue*).
5. Nếu hỏi về Gemini trong Firebase → để mặc định → **Tiếp tục**.
6. Màn hình **Google Analytics** → **tắt** công tắc (không cần) → **Tạo dự án** (*Create project*).
7. Chờ khoảng 30 giây → bấm **Tiếp tục** (*Continue*).

## Bước 2. Bật đăng nhập bằng Google
1. Cột bên trái: bấm **Bảo mật** hoặc **Build** → **Authentication**.
2. Bấm **Bắt đầu** (*Get started*).
3. Tab **Phương thức đăng nhập** (*Sign-in method*) → chọn **Google**.
4. Bật công tắc **Bật** (*Enable*).
5. Ô **Email hỗ trợ dự án** (*Support email*) → chọn email của cô.
6. Bấm **Lưu** (*Save*).

## Bước 3. Tạo cơ sở dữ liệu Firestore
1. Cột bên trái: **Build** (hoặc **Databases & Storage**) → **Firestore Database**.
2. Bấm **Tạo cơ sở dữ liệu** (*Create database*).
3. Nếu được hỏi phiên bản → chọn **Standard edition** → **Tiếp** (*Next*).
4. **Vị trí** (*Location*): chọn **asia-southeast1 (Singapore)** — gần Việt Nam nhất → **Tiếp** (*Next*).
   ⚠ Vị trí này không đổi được sau này.
5. Chọn **Bắt đầu ở chế độ sản xuất** (*Start in production mode*) → **Tạo** (*Create*).

## Bước 4. Dán "Quy tắc bảo mật" (chỉ email của cô được vào)
1. Vẫn ở trang Firestore → bấm tab **Quy tắc** (*Rules*).
2. Bấm vào khung chữ, nhấn **Ctrl + A** (chọn hết) rồi **Delete** (xóa hết).
3. Mở file **`firestore-rules-cua-co.txt`** em gửi trong khung chat → chọn hết → sao chép → dán vào khung.
4. Bấm **Xuất bản** (*Publish*).

## Bước 5. Lấy "mã kết nối" của app
1. Góc trên bên trái, bấm biểu tượng **bánh răng ⚙** → **Cài đặt dự án** (*Project settings*).
2. Kéo xuống phần **Ứng dụng của bạn** (*Your apps*) → bấm biểu tượng **`</>`** (Web).
3. Ô biệt danh: gõ `Lop Van` → **không** tick ô Firebase Hosting → bấm **Đăng ký ứng dụng** (*Register app*).
4. Màn hình hiện một đoạn chữ có dạng:
   ```
   const firebaseConfig = {
     apiKey: "AIza....",
     authDomain: "lop-van-co-ha-van.firebaseapp.com",
     projectId: "lop-van-co-ha-van",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "1:...:web:..."
   };
   ```
5. **Bôi đen cả đoạn đó → sao chép → dán vào khung chat gửi em.**
   (Đoạn này không phải mật khẩu — nó chỉ cho biết app nối vào dự án nào. Dữ liệu vẫn được khóa bằng quy tắc ở Bước 4.)
6. Bấm **Tiếp tục đến bảng điều khiển** (*Continue to console*).

Xong! Em sẽ dùng mã đó để đưa app lên mạng cho cô dùng thử trên điện thoại.
