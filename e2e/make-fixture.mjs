// Tạo file Excel GIẢ (tên, SĐT bịa ra) để chạy thử — không dùng dữ liệu học sinh thật.
import ExcelJS from "exceljs";

export async function makeFixture(path) {
  const wb = new ExcelJS.Workbook();
  const hs = wb.addWorksheet("Hoc sinh");
  hs.addRow(["Mã HS", "Họ tên", "Lớp học thêm", "Khối", "Trường", "Lớp ở trường", "Tên phụ huynh", "Zalo/Facebook", "SĐT phụ huynh", "Cách tính học phí", "Ghi chú", "Cần kiểm tra"]);
  const classes = [["TH", "Văn tiểu học", "Tiểu học"], ["V6", "Văn 6", "6"], ["V7", "Văn 7", "7"], ["V8", "Văn 8", "8"], ["V91", "Văn 9.1", "9"], ["V92", "Văn 9.2", "9"]];
  const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi"];
  const ten = ["An", "Bình", "Chi", "Dũng", "Giang", "Hà", "Khôi", "Lan", "Minh", "Nam", "Oanh", "Phúc", "Quân", "Sơn", "Thảo"];
  let k = 0;
  for (const [code, name, khoi] of classes) {
    for (let i = 1; i <= 5; i++, k++) {
      const hoTen = `${ho[k % ho.length]} ${ten[(k * 7) % ten.length]} ${ten[(k * 3 + 1) % ten.length]}`;
      hs.addRow([`${code}-${String(i).padStart(2, "0")}`, hoTen, name, khoi, "Trường Thử", khoi === "Tiểu học" ? "5" : khoi,
        `Phụ huynh ${k + 1}`, "", 900000000 + k * 1111, "", "", ""]);
    }
  }
  // Các trường hợp đặc biệt để kiểm tra
  hs.addRow(["TH-06", "Ngô Bảo Ngọc", "Văn tiểu học", "Tiểu học", "Trường Thử", "4", "", "", "", "", "", "Thiếu SĐT; Thiếu tên phụ huynh"]);
  hs.addRow(["TH-07", "Lý Minh Khoa", "Văn tiểu học", "Tiểu học", "Trường Thử", "4", "Lý Văn Hải", "", "091234567", "", "", ""]);
  hs.addRow(["V92-06", "Ngô Bảo Ngọc", "Văn 9.2", "9", "Trường Thử", "9", "Ngô Văn Tú", "", "0987000111", "", "", ""]);
  hs.addRow(["TH-08", "Đinh Thu Mai", "Văn tiểu học", "Tiểu học", "Trường Thử", "5", "Đinh Văn Lộc", "", "0912000333", "", "", ""]);
  const lh = wb.addWorksheet("Lop hoc");
  lh.addRow(["Mã lớp", "Tên lớp", "Khối", "Lịch học", "Cách tính học phí"]);
  lh.addRows([
    ["TH", "Văn tiểu học", "Tiểu học", "T7 14:00-16:00", "Theo buổi"],
    ["V6", "Văn 6", "6", "T4 17:00-19:00; T7 17:00-19:00", "Theo tháng"],
    ["V7", "Văn 7", "7", "T2 17:00-19:00; T6 17:00-19:00", "Theo tháng"],
    ["V8", "Văn 8", "8", "T3 19:00-21:00; T5 19:00-21:00", "Theo tháng"],
    ["V91", "Văn 9.1", "9", "T2 19:00-21:00; T4 19:00-21:00", "Theo tháng"],
    ["V92", "Văn 9.2", "9", "T3 17:00-19:00; T5 17:00-19:00", "Theo tháng"],
  ]);
  await wb.xlsx.writeFile(path);
  return path;
}
