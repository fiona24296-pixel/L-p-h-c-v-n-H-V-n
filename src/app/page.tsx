"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useData } from "@/components/DataProvider";
import { IconChevron, IconClock } from "@/components/icons";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { formatDate, nowHHmm, todayISO, weekdayOf } from "@/lib/dates";
import { sessionsOnWeekday, WEEKDAY_FULL } from "@/lib/schedule";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function TodayPage() {
  const { loading, classes, students } = useData();
  const now = useNow();
  const today = todayISO(now);
  const wd = weekdayOf(today);
  const hhmm = nowHHmm(now);
  const sessions = sessionsOnWeekday(classes, wd);
  const countByClass = new Map<string, number>();
  for (const s of students) if (s.status === "active") countByClass.set(s.classId, (countByClass.get(s.classId) ?? 0) + 1);

  // Ngày học tiếp theo (khi hôm nay không có ca)
  let nextDay: { wd: number; inDays: number } | null = null;
  for (let i = 1; i <= 7 && sessions.length === 0; i++) {
    const d = (wd + i) % 7;
    if (sessionsOnWeekday(classes, d).length) {
      nextDay = { wd: d, inDays: i };
      break;
    }
  }

  return (
    <>
      <PageHeader title="Ca học hôm nay" subtitle={`${WEEKDAY_FULL[wd]}, ${formatDate(today)}`} />
      <div className="space-y-3 px-4">
        {loading ? (
          <Spinner />
        ) : sessions.length === 0 ? (
          <EmptyState title="Hôm nay cô không có ca dạy 🌿">
            {nextDay && (
              <p>
                Ca gần nhất: <b>{WEEKDAY_FULL[nextDay.wd]}</b>
                {nextDay.inDays === 1 ? " (ngày mai)" : ""} —{" "}
                {sessionsOnWeekday(classes, nextDay.wd).map((s) => s.classRoom.name).join(", ")}
              </p>
            )}
          </EmptyState>
        ) : (
          sessions.map(({ classRoom, slot }) => {
            const status = hhmm < slot.start ? "upcoming" : hhmm < slot.end ? "live" : "done";
            return (
              <Link key={`${classRoom.id}-${slot.start}`} href={`/lop?lop=${classRoom.id}`} className="block">
                <Card className={`flex items-center gap-4 active:bg-brand-50 ${status === "live" ? "ring-2 ring-brand-500" : ""}`}>
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-center">
                    <div>
                      <div className="text-lg font-bold leading-tight text-brand-700">{slot.start}</div>
                      <div className="text-xs text-muted">{slot.end}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-brand-900">{classRoom.name}</p>
                    <p className="text-[15px] text-muted">Sĩ số: {countByClass.get(classRoom.id) ?? 0} em</p>
                    <p className="mt-1">
                      {status === "live" && <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-sm font-medium text-white">Đang học</span>}
                      {status === "upcoming" && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-sm font-medium text-amber-700"><IconClock className="h-4 w-4" />Sắp tới</span>}
                      {status === "done" && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-600">Đã xong giờ học</span>}
                    </p>
                  </div>
                  <IconChevron className="h-6 w-6 text-brand-300" />
                </Card>
              </Link>
            );
          })
        )}
        <p className="px-1 pt-2 text-center text-sm text-muted">Điểm danh &amp; ghi buổi sẽ có ở Giai đoạn 2.</p>
      </div>
    </>
  );
}
