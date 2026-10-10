"use client";

import { onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useData } from "@/components/DataProvider";
import { IconChevron, IconClock } from "@/components/icons";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { formatDate, nowHHmm, todayISO, weekdayOf } from "@/lib/dates";
import { sessionRef } from "@/lib/db";
import { sessionsOnWeekday, WEEKDAY_FULL } from "@/lib/schedule";
import { sessionId, summarize, toSession } from "@/lib/session";
import type { ClassSession } from "@/lib/types";

/** Theo dõi các buổi của hôm nay (đã điểm danh chưa, bao nhiêu em có mặt). */
function useTodaySessions(ids: string[]) {
  const [map, setMap] = useState<Record<string, ClassSession | null>>({});
  const key = ids.join(",");
  useEffect(() => {
    if (!key) return;
    const unsubs = key.split(",").map((id) =>
      onSnapshot(sessionRef(id), (snap) =>
        setMap((m) => ({ ...m, [id]: snap.exists() ? toSession(snap.id, snap.data()) : null })),
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [key]);
  return map;
}

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
  const docs = useTodaySessions(sessions.map((s) => sessionId(s.classRoom.id, today, s.slot.start)));
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
            const doc = docs[sessionId(classRoom.id, today, slot.start)];
            const sum = doc ? summarize(doc) : null;
            const href = `/diem-danh?lop=${classRoom.id}&ngay=${today}&gio=${slot.start}&den=${slot.end}`;
            return (
              <Link key={`${classRoom.id}-${slot.start}`} href={href} className="block">
                <Card className={`flex items-center gap-4 active:bg-brand-50 ${status === "live" ? "ring-2 ring-brand-500" : ""}`}>
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-center">
                    <div>
                      <div className="text-lg font-bold leading-tight text-brand-700">{slot.start}</div>
                      <div className="text-xs text-muted">{slot.end}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-brand-900">{classRoom.name}</p>
                    <p className="text-[15px] text-muted">
                      {doc?.cancelled ? "Nghỉ cả lớp" : sum ? (
                        <span className="font-semibold text-emerald-700">Đã điểm danh: có mặt {sum.attending}/{sum.total}</span>
                      ) : `Sĩ số: ${countByClass.get(classRoom.id) ?? 0} em`}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1.5">
                      {!doc && status !== "upcoming" && <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-sm font-medium text-white">Chạm để điểm danh</span>}
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
        {!loading && (
          <Link href="/buoi-hoc" className="block pt-2 text-center text-[15px] font-medium text-brand-700 underline">
            Xem các buổi học khác / thêm buổi học bù
          </Link>
        )}
      </div>
    </>
  );
}
