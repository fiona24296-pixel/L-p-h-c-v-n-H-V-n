"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/components/DataProvider";
import { IconDownload, IconLogout } from "@/components/icons";
import { ImportPanel } from "@/components/ImportPanel";
import { Button, Card, PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { formatSchedule } from "@/lib/schedule";

export default function SettingsPage() {
  const { state, logOut } = useAuth();
  const { classes, students } = useData();
  const [busy, setBusy] = useState<"" | "template" | "export">("");

  async function download(kind: "template" | "export") {
    setBusy(kind);
    try {
      const { buildStudentWorkbook, downloadWorkbook } = await import("@/lib/excel-export");
      const wb = await buildStudentWorkbook(classes, kind === "export" ? students : []);
      await downloadWorkbook(wb, kind === "export" ? `Danh sach hoc sinh ${todayISO()}.xlsx` : "Mau nhap hoc sinh.xlsx");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <PageHeader title="Cài đặt" />
      <div className="space-y-4 px-4">
        <ImportPanel />

        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-brand-900">File Excel</h2>
          <Button variant="secondary" className="w-full" disabled={!!busy} onClick={() => download("template")}>
            <IconDownload /> {busy === "template" ? "Đang tạo…" : "Tải file Excel mẫu (trống)"}
          </Button>
          <Button variant="secondary" className="w-full" disabled={!!busy || students.length === 0} onClick={() => download("export")}>
            <IconDownload /> {busy === "export" ? "Đang tạo…" : `Tải danh sách hiện tại (${students.length} em)`}
          </Button>
          <p className="text-sm text-muted">Mẹo: tải danh sách hiện tại về, sửa trong Excel, rồi nhập lại — app tự cập nhật theo Mã HS.</p>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-lg font-bold text-brand-900">Lịch các lớp</h2>
          {classes.map((c) => (
            <div key={c.id} className="flex items-baseline justify-between gap-3 border-b border-brand-50 py-1.5 last:border-0">
              <span className="font-medium">{c.name}</span>
              <span className="text-right text-[15px] text-muted">{formatSchedule(c.schedule) || "Chưa có lịch"}</span>
            </div>
          ))}
          <p className="pt-1 text-sm text-muted">Sửa lịch, học phí, thẻ nhận xét, thông tin ngân hàng… sẽ có ở Giai đoạn 5. Hiện cô có thể đổi lịch qua sheet &quot;Lop hoc&quot; khi nhập Excel.</p>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-brand-900">Tài khoản</h2>
          {state.status === "ready" && (
            <p className="text-[15px] text-muted">Đang đăng nhập: <b className="text-ink">{state.user.email}</b></p>
          )}
          <Button variant="danger" className="w-full" onClick={logOut}>
            <IconLogout /> Đăng xuất
          </Button>
        </Card>
        <p className="pb-4 text-center text-sm text-muted">Lớp Văn Cô Hạ Vân · phiên bản 0.1</p>
      </div>
    </>
  );
}
