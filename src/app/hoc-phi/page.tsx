import { EmptyState, PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Học phí" />
      <div className="px-4">
        <EmptyState title="Đang xây dựng 🛠️">Tính học phí, phiếu báo, mã QR và theo dõi thu tiền sẽ có ở Giai đoạn 4–5.</EmptyState>
      </div>
    </>
  );
}
