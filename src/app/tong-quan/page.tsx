import { EmptyState, PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Tổng quan" />
      <div className="px-4">
        <EmptyState title="Đang xây dựng 🛠️">Sĩ số, cảnh báo vắng nhiều / BTVN thấp, tình hình thu tiền sẽ có ở Giai đoạn 5.</EmptyState>
      </div>
    </>
  );
}
