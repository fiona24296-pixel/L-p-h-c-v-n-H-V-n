"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { IconPhone, IconPlus, IconSearch } from "@/components/icons";
import { StudentSheet } from "@/components/StudentSheet";
import { Button, Card, Chip, EmptyState, inputClass, PageHeader, Spinner, useToast } from "@/components/ui";
import { emptyStudent } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { formatSchedule } from "@/lib/schedule";
import { studentWarnings } from "@/lib/student-warnings";
import { matchesSearch } from "@/lib/text";
import type { Student } from "@/lib/types";

type Filter = "all" | "check" | "inactive";

function ClassesView() {
  const { loading, classes, students, classById } = useData();
  const params = useSearchParams();
  const router = useRouter();
  const classId = params.get("lop") ?? "";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<{ student: Student; isNew: boolean } | null>(null);
  const toast = useToast();

  const allIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of students) if (s.status === "active") m.set(s.classId, (m.get(s.classId) ?? 0) + 1);
    return m;
  }, [students]);

  const list = useMemo(
    () =>
      students.filter((s) => {
        if (classId && s.classId !== classId) return false;
        if (filter === "inactive" ? s.status !== "inactive" : s.status !== "active") return false;
        if (filter === "check" && studentWarnings(s).length === 0) return false;
        return matchesSearch([s.name, s.id, s.parentName, s.phone, s.school], query);
      }),
    [students, classId, filter, query],
  );
  const activeCount = students.filter((s) => s.status === "active").length;
  const checkCount = students.filter(
    (s) => s.status === "active" && (!classId || s.classId === classId) && studentWarnings(s).length,
  ).length;

  const selectClass = (id: string) => router.replace(id ? `/lop?lop=${id}` : "/lop", { scroll: false });
  const current = classById.get(classId);

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Lớp học"
        subtitle={current ? `${current.name} · ${formatSchedule(current.schedule)}` : `${activeCount} học sinh đang học · ${classes.length} lớp`}
        action={
          <Button className="!px-4" aria-label="Thêm học sinh"
            onClick={() => setEditing({ student: emptyStudent(current), isNew: true })}>
            <IconPlus /> Thêm
          </Button>
        }
      />

      <div className="sticky top-0 z-30 space-y-3 bg-page/95 px-4 pb-3 pt-1 backdrop-blur">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Chip active={!classId} onClick={() => selectClass("")}>Tất cả</Chip>
          {classes.map((c) => (
            <Chip key={c.id} active={classId === c.id} onClick={() => selectClass(c.id)}>
              {c.name} <span className="opacity-70">({counts.get(c.id) ?? 0})</span>
            </Chip>
          ))}
        </div>
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input type="search" className={`${inputClass} pl-11`} placeholder="Tìm tên, mã HS, phụ huynh, SĐT…"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>Đang học</Chip>
          <Chip active={filter === "check"} onClick={() => setFilter("check")}>⚠ Cần kiểm tra ({checkCount})</Chip>
          <Chip active={filter === "inactive"} onClick={() => setFilter("inactive")}>Đã nghỉ</Chip>
        </div>
      </div>

      <div className="space-y-2 px-4">
        {current && (
          <Link href={`/buoi-hoc?lop=${current.id}`} className="block">
            <Card className="flex items-center justify-between !bg-brand-50 !p-3 active:bg-brand-100">
              <span className="font-semibold text-brand-800">📋 Các buổi học &amp; xuất Excel điểm danh</span>
              <span className="text-xl text-brand-400">›</span>
            </Card>
          </Link>
        )}
        {students.length === 0 ? (
          <EmptyState title="Chưa có học sinh nào">
            <p>Cô vào <Link href="/cai-dat" className="font-semibold text-brand-700 underline">Cài đặt → Nhập từ Excel</Link> để đưa danh sách vào app, hoặc bấm &quot;Thêm&quot;.</p>
          </EmptyState>
        ) : list.length === 0 ? (
          <EmptyState title="Không có học sinh phù hợp" />
        ) : (
          <>
            <p className="px-1 text-sm text-muted">{list.length} học sinh</p>
            {list.map((s) => {
              const warns = studentWarnings(s);
              return (
                <Card key={s.id} className="flex items-center gap-3 !p-3">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditing({ student: s, isNew: false })}>
                    <p className="flex items-center gap-1.5 text-[17px] font-semibold text-ink">
                      <span className="truncate">{s.name}</span>
                      {warns.length > 0 && <span title={warns.join(", ")} aria-label="Cần kiểm tra" className="text-amber-500">⚠</span>}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {s.id}{!classId && ` · ${classById.get(s.classId)?.name ?? "Chưa có lớp"}`}
                      {s.parentName && ` · PH: ${s.parentName}`}
                    </p>
                    {warns.length > 0 && <p className="truncate text-sm text-amber-700">{warns.join(" · ")}</p>}
                  </button>
                  {s.phone && (
                    <a href={`tel:${s.phone}`} aria-label={`Gọi ${formatPhone(s.phone)}`}
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 active:bg-brand-100">
                      <IconPhone className="h-5 w-5" />
                    </a>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </div>

      {editing && (
        <StudentSheet
          key={editing.student.id || "new"}
          student={editing.student}
          isNew={editing.isNew}
          classes={classes}
          allIds={allIds}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            toast.show(msg);
          }}
        />
      )}
      {toast.node}
    </>
  );
}

export default function ClassesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ClassesView />
    </Suspense>
  );
}
