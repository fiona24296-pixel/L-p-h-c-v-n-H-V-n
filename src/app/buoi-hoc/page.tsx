"use client";

import { onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { IconChevron, IconDownload, IconPlus } from "@/components/icons";
import { Button, Card, Chip, EmptyState, Field, inputClass, PageHeader, Sheet, Spinner } from "@/components/ui";
import { formatDate, todayISO, weekdayOf } from "@/lib/dates";
import { sessionsQuery } from "@/lib/db";
import { periodOf, shiftPeriod, type Period } from "@/lib/periods";
import { scheduledDates, WEEKDAY_LABELS } from "@/lib/schedule";
import { SESSION_TYPE_LABELS, sessionId, summarize, toSession } from "@/lib/session";
import type { ClassSession, SessionType } from "@/lib/types";

function attendanceHref(classId: string, date: string, start: string, end?: string, type?: SessionType) {
  const q = new URLSearchParams({ lop: classId, ngay: date, gio: start });
  if (end) q.set("den", end);
  if (type && type !== "official") q.set("loai", type);
  return `/diem-danh?${q}`;
}

function useClassSessions(classId: string, period: Period) {
  const [state, setState] = useState<{ key: string; list: ClassSession[] } | null>(null);
  const key = `${classId}|${period.id}`;
  useEffect(() => {
    if (!classId) return;
    return onSnapshot(sessionsQuery(classId, period.from, period.to), (snap) =>
      setState({ key, list: snap.docs.map((d) => toSession(d.id, d.data())) }),
    );
  }, [classId, period.from, period.to, key]);
  return state?.key === key ? state.list : null;
}

function SessionsView() {
  const params = useSearchParams();
  const router = useRouter();
  const { loading, classes, classById, students, settings } = useData();
  const classId = params.get("lop") || classes[0]?.id || "";
  const classRoom = classById.get(classId);
  const today = todayISO();
  const [period, setPeriod] = useState<Period>(() => periodOf(today, settings.feePeriods));
  const sessions = useClassSessions(classId, period);
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Gộp buổi đã ghi + buổi theo lịch chưa điểm danh.
  const items = useMemo(() => {
    if (!classRoom || !sessions) return [];
    const byId = new Map(sessions.map((s) => [s.id, s]));
    const list: { id: string; date: string; start: string; end: string; session?: ClassSession }[] = sessions.map((s) => ({
      id: s.id, date: s.date, start: s.start, end: s.end, session: s,
    }));
    for (const { date, slot } of scheduledDates(classRoom, period.from, period.to)) {
      const id = sessionId(classRoom.id, date, slot.start);
      if (!byId.has(id)) list.push({ id, date, start: slot.start, end: slot.end });
    }
    return list.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  }, [classRoom, sessions, period]);

  async function exportExcel() {
    if (!classRoom || !sessions) return;
    setExporting(true);
    try {
      const [{ buildAttendanceMatrix, buildAttendanceWorkbook }, { downloadWorkbook }] = await Promise.all([
        import("@/lib/attendance-export"),
        import("@/lib/excel-export"),
      ]);
      const matrix = buildAttendanceMatrix(sessions, students, classRoom.id);
      const wb = await buildAttendanceWorkbook(classRoom, period.label, matrix);
      await downloadWorkbook(wb, `Diem danh ${classRoom.name} ${period.short}.xlsx`);
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="Các buổi học" subtitle={classRoom?.name} />
      <div className="space-y-3 px-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {classes.map((c) => (
            <Chip key={c.id} active={c.id === classId} onClick={() => router.replace(`/buoi-hoc?lop=${c.id}`, { scroll: false })}>
              {c.name}
            </Chip>
          ))}
        </div>

        <Card className="flex items-center justify-between !p-2">
          <button type="button" aria-label="Kỳ trước" onClick={() => setPeriod(shiftPeriod(period, -1, settings.feePeriods))}
            className="grid h-12 w-12 place-items-center rounded-2xl text-2xl text-brand-700 active:bg-brand-50">‹</button>
          <span className="text-[17px] font-bold text-brand-900">{period.label}</span>
          <button type="button" aria-label="Kỳ sau" onClick={() => setPeriod(shiftPeriod(period, 1, settings.feePeriods))}
            className="grid h-12 w-12 place-items-center rounded-2xl text-2xl text-brand-700 active:bg-brand-50">›</button>
        </Card>

        <div className="flex gap-2">
          <Button className="flex-1 !px-3" onClick={() => setAdding(true)}><IconPlus /> Thêm buổi</Button>
          <Button variant="secondary" className="flex-1 !px-3" disabled={exporting || !sessions?.length} onClick={exportExcel}>
            <IconDownload /> {exporting ? "Đang tạo…" : "Xuất Excel"}
          </Button>
        </div>

        {!sessions ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="Kỳ này chưa có buổi nào" />
        ) : (
          <ul className="space-y-2">
            {items.map((it) => {
              const s = it.session;
              const sum = s ? summarize(s) : null;
              const future = it.date > today;
              return (
                <li key={it.id}>
                  <Link href={attendanceHref(classId, it.date, it.start, it.end)} className="block">
                    <Card className={`flex items-center gap-3 !p-3 active:bg-brand-50 ${!s && future ? "opacity-60" : ""}`}>
                      <div className="w-14 shrink-0 text-center">
                        <div className="text-sm text-muted">{WEEKDAY_LABELS[weekdayOf(it.date)]}</div>
                        <div className="text-lg font-bold text-brand-900">{formatDate(it.date).slice(0, 5)}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] text-muted">
                          {it.start}–{it.end}
                          {s && s.type !== "official" && <span className="ml-1 font-medium text-violet-700">· {SESSION_TYPE_LABELS[s.type]}</span>}
                        </p>
                        {s?.cancelled ? (
                          <p className="font-semibold text-slate-500">Nghỉ cả lớp</p>
                        ) : s && sum ? (
                          <>
                            <p className="font-semibold text-emerald-700">
                              Có mặt {sum.attending}/{sum.total}
                              {sum.excused + sum.unexcused > 0 && <span className="text-red-600"> · Vắng {sum.excused + sum.unexcused}</span>}
                            </p>
                            {s.content && <p className="truncate text-sm text-muted">{s.content}</p>}
                          </>
                        ) : (
                          <p className={future ? "text-slate-500" : "font-medium text-amber-700"}>{future ? "Sắp tới" : "Chưa điểm danh"}</p>
                        )}
                      </div>
                      <IconChevron className="h-5 w-5 shrink-0 text-brand-300" />
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {adding && classRoom && (
        <AddSessionSheet
          defaultDate={today}
          onClose={() => setAdding(false)}
          onCreate={(date, start, end, type) => router.push(attendanceHref(classRoom.id, date, start, end, type))}
        />
      )}
    </>
  );
}

function AddSessionSheet({
  defaultDate,
  onClose,
  onCreate,
}: {
  defaultDate: string;
  onClose: () => void;
  onCreate: (date: string, start: string, end: string, type: SessionType) => void;
}) {
  const [date, setDate] = useState(defaultDate);
  const [start, setStart] = useState("17:00");
  const [end, setEnd] = useState("19:00");
  const [type, setType] = useState<SessionType>("makeup");
  return (
    <Sheet
      open
      title="Thêm buổi khác lịch"
      onClose={onClose}
      footer={<Button className="w-full" disabled={!date || !start || !end || end <= start} onClick={() => onCreate(date, start, end, type)}>Tạo buổi &amp; điểm danh</Button>}
    >
      <div className="space-y-4">
        <p className="text-[15px] text-muted">Dùng khi cô dạy bù, dạy thêm buổi bổ trợ, hoặc đổi giờ.</p>
        <Field label="Ngày">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bắt đầu"><input type="time" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="Kết thúc"><input type="time" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        </div>
        <div>
          <p className="mb-2 text-[15px] font-medium text-slate-700">Loại buổi</p>
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-brand-50 p-1">
            {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`min-h-11 rounded-xl text-[15px] font-medium ${type === t ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"}`}>
                {SESSION_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SessionsView />
    </Suspense>
  );
}
