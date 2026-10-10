"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useData } from "@/components/DataProvider";
import { BulkApplySheet, type BulkValues } from "@/components/session/BulkApplySheet";
import { DebouncedField } from "@/components/session/DebouncedField";
import { GuestSheet } from "@/components/session/GuestSheet";
import { StudentRecordSheet } from "@/components/session/StudentRecordSheet";
import { TagEditorSheet } from "@/components/session/TagEditorSheet";
import { useSessionDoc } from "@/components/session/useSessionDoc";
import { Button, Card, EmptyState, inputClass, Spinner, useToast } from "@/components/ui";
import { formatDate, weekdayOf } from "@/lib/dates";
import { createSession, deleteSession, patchSession } from "@/lib/db";
import { WEEKDAY_FULL } from "@/lib/schedule";
import {
  ATTITUDE_LABELS,
  defaultTestParts,
  emptyRecord,
  formatScoreLine,
  HOMEWORK_STYLE,
  homeworkColor,
  isAttending,
  missingStudents,
  newSession,
  nextStatus,
  SESSION_TYPE_LABELS,
  sessionId,
  STATUS_SHORT,
  STATUS_STYLE,
  summarize,
} from "@/lib/session";
import type { AttendanceRecord, SessionType, Student } from "@/lib/types";

function addHours(hhmm: string, h: number) {
  const [a, b] = hhmm.split(":").map(Number);
  return `${String(Math.min(23, a + h)).padStart(2, "0")}:${String(b).padStart(2, "0")}`;
}

function AttendanceView() {
  const params = useSearchParams();
  const router = useRouter();
  const classId = params.get("lop") ?? "";
  const date = params.get("ngay") ?? "";
  const start = params.get("gio") ?? "";
  const { loading: dataLoading, classById, students, studentById, settings } = useData();
  const classRoom = classById.get(classId);
  const id = classId && date && start ? sessionId(classId, date, start) : null;
  const { loading, exists, session, pending } = useSessionDoc(id);
  const toast = useToast();

  const [openId, setOpenId] = useState<string | null>(null);
  const [bulk, setBulk] = useState<BulkValues | null>(null);
  const [editTags, setEditTags] = useState(false);
  const [guest, setGuest] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const created = useRef(false);

  // Mở ca lần đầu: tạo buổi, cả lớp mặc định Có mặt.
  useEffect(() => {
    if (loading || dataLoading || exists || !classRoom || created.current || !id) return;
    created.current = true;
    const slot = classRoom.schedule.find((s) => s.weekday === weekdayOf(date) && s.start === start);
    const end = params.get("den") ?? slot?.end ?? addHours(start, 2);
    const type = (params.get("loai") as SessionType | null) ?? "official";
    void createSession(newSession(classRoom, date, start, end, students, type));
  }, [loading, dataLoading, exists, classRoom, id, date, start, params, students]);

  // Học sinh mới vào lớp sau khi buổi được tạo: hỏi cô có thêm vào buổi không (buổi cũ thường không cần).
  const missing = useMemo(() => (session ? missingStudents(session, students) : []), [session, students]);

  const rows = useMemo(() => {
    if (!session) return [];
    return Object.entries(session.records)
      .map(([sid, rec]) => ({ student: studentById.get(sid), sid, rec }))
      .filter((r): r is { student: Student; sid: string; rec: AttendanceRecord } => !!r.student)
      .sort((a, b) => Number(!!a.rec.guest) - Number(!!b.rec.guest) || a.sid.localeCompare(b.sid, "vi", { numeric: true }));
  }, [session, studentById]);

  if (!classId || !date || !start) return <div className="p-4"><EmptyState title="Thiếu thông tin ca học" /></div>;
  if (loading || dataLoading || !session) return <Spinner label="Đang mở ca học…" />;
  if (!classRoom) return <div className="p-4"><EmptyState title="Không tìm thấy lớp này" /></div>;

  const sum = summarize(session);
  const openIndex = rows.findIndex((r) => r.sid === openId);
  const open = openIndex >= 0 ? rows[openIndex] : null;
  const patch = (p: Record<string, unknown>) => void patchSession(session.id, p);
  const setRec = (sid: string, p: Partial<Record<keyof AttendanceRecord, unknown>>) => patch({ records: { [sid]: p } });

  function applyAll(v: BulkValues) {
    const records: Record<string, Partial<AttendanceRecord>> = {};
    let n = 0;
    for (const { sid, rec } of rows) {
      if (!isAttending(rec.status)) continue;
      const p: Partial<AttendanceRecord> = {};
      if (v.homework !== undefined) p.homework = v.homework;
      if (v.attitude !== undefined) p.attitude = v.attitude;
      if (v.addTags.length) p.tags = [...new Set([...rec.tags, ...v.addTags])];
      records[sid] = p;
      n++;
    }
    patch({ records });
    setBulk(null);
    toast.show(`Đã áp dụng cho ${n} em có mặt`);
  }

  function addMissing() {
    const records: Record<string, AttendanceRecord> = {};
    for (const s of missing) records[s.id] = emptyRecord();
    patch({ records });
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/95 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} aria-label="Quay lại"
            className="-ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl text-brand-700 active:bg-brand-50">‹</button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-brand-900">{classRoom.name}</h1>
            <p className="truncate text-sm text-muted">
              {WEEKDAY_FULL[weekdayOf(date)]}, {formatDate(date)} · {session.start}–{session.end}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${pending ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {pending ? "Đang lưu…" : "Đã lưu ✓"}
          </span>
        </div>
        {!session.cancelled && (
          <p className="mt-1 text-[15px]">
            <b className="text-emerald-700">Có mặt {sum.attending}/{sum.total}</b>
            {sum.excused > 0 && <span className="text-amber-700"> · Vắng P {sum.excused}</span>}
            {sum.unexcused > 0 && <span className="text-red-600"> · Vắng KP {sum.unexcused}</span>}
            {sum.makeup > 0 && <span className="text-violet-700"> · Học bù {sum.makeup}</span>}
          </p>
        )}
      </header>

      <div className="space-y-4 px-4 pt-4">
        <Card className="space-y-4">
          <div>
            <p className="mb-2 text-[15px] font-semibold text-slate-700">Loại buổi</p>
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-brand-50 p-1">
              {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map((t) => (
                <button key={t} type="button" onClick={() => patch({ type: t })}
                  className={`min-h-11 rounded-xl text-[15px] font-medium ${session.type === t ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"}`}>
                  {SESSION_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant={session.cancelled ? "secondary" : "danger"}
            className="w-full"
            onClick={() => patch({ cancelled: !session.cancelled })}
          >
            {session.cancelled ? "↺ Bỏ nghỉ — học bình thường" : "Nghỉ cả lớp (cô cho nghỉ)"}
          </Button>

          {!session.cancelled && (
            <>
              <label className="block">
                <span className="mb-1 block text-[15px] font-semibold text-slate-700">Nội dung bài học</span>
                <DebouncedField multiline className={`${inputClass} min-h-20`} value={session.content}
                  placeholder="Ví dụ: Đọc hiểu văn bản thơ “Những cánh buồm”" onCommit={(v) => patch({ content: v })} aria-label="Nội dung bài học" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[15px] font-semibold text-slate-700">Bài tập về nhà</span>
                <DebouncedField multiline className={`${inputClass} min-h-16`} value={session.homeworkText}
                  placeholder="Ví dụ: Viết đoạn văn 7–10 câu cảm nhận khổ thơ cuối" onCommit={(v) => patch({ homeworkText: v })} aria-label="Bài tập về nhà" />
              </label>
              <div className="space-y-2">
                <label className="flex min-h-11 items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold text-slate-700">Có bài kiểm tra</span>
                  <input type="checkbox" className="h-7 w-7 accent-brand-600" checked={!!session.testName}
                    onChange={(e) =>
                      patch(e.target.checked
                        ? { testName: `KT ${formatDate(date).slice(0, 5)}`, testParts: session.testParts.length ? session.testParts : defaultTestParts(classRoom) }
                        : { testName: "" })
                    } />
                </label>
                {session.testName && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="mb-1 block text-sm text-muted">Tên bài KT</span>
                      <DebouncedField className={inputClass} value={session.testName} aria-label="Tên bài kiểm tra"
                        onCommit={(v) => patch({ testName: v.trim() || `KT ${formatDate(date).slice(0, 5)}` })} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm text-muted">Các phần điểm</span>
                      <DebouncedField className={inputClass} value={session.testParts.join(", ")} aria-label="Các phần điểm"
                        placeholder="Tập làm văn, Tiếng Việt"
                        onCommit={(v) => {
                          const parts = v.split(",").map((x) => x.trim()).filter(Boolean);
                          patch({ testParts: parts.length ? parts : ["Điểm"] });
                        }} />
                    </label>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>

        {session.cancelled ? (
          <EmptyState title="Buổi này cả lớp nghỉ">Buổi nghỉ không tính vào học phí và không ghi điểm danh.</EmptyState>
        ) : (
          <>
            <div className="flex gap-2">
              <Button className="flex-1 !px-3" onClick={() => setBulk({ addTags: [] })}>Áp dụng cho cả lớp</Button>
              <Button variant="secondary" className="!px-4" onClick={() => setEditTags(true)}>✎ Thẻ</Button>
            </div>
            <p className="px-1 text-sm text-muted">Chạm ô trạng thái để đổi · Chạm tên để chấm BTVN, ý thức, thẻ nhận xét</p>

            {missing.length > 0 && (
              <Card className="flex items-center justify-between gap-3 !bg-amber-50">
                <p className="text-[15px] text-amber-800">{missing.length} em mới vào lớp chưa có trong buổi này.</p>
                <Button variant="secondary" className="shrink-0 !min-h-10 !px-3" onClick={addMissing}>Thêm vào</Button>
              </Card>
            )}

            <ul className="space-y-2">
              {rows.map(({ student, sid, rec }, i) => {
                const score = formatScoreLine(session, rec);
                return (
                  <li key={sid}>
                    <Card className="flex items-center gap-3 !p-2.5">
                      <button type="button" onClick={() => setRec(sid, { status: nextStatus(rec.status) })}
                        aria-label={`Trạng thái ${student.name}: ${STATUS_SHORT[rec.status]}. Chạm để đổi`}
                        className={`min-h-12 w-[5.5rem] shrink-0 rounded-2xl text-[14px] font-bold ring-1 ${STATUS_STYLE[rec.status]}`}>
                        {STATUS_SHORT[rec.status]}
                      </button>
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpenId(sid)}>
                        <p className="truncate text-[16px] font-semibold">
                          <span className="mr-1 text-sm font-normal text-slate-400">{i + 1}.</span>
                          {student.name}
                          {rec.guest && <span className="ml-1 text-sm font-normal text-violet-700">(lớp khác)</span>}
                        </p>
                        <div className="mt-0.5 flex flex-wrap gap-1 text-xs">
                          {rec.homework !== null && (
                            <span className={`rounded-full px-2 py-0.5 font-semibold ${HOMEWORK_STYLE[homeworkColor(rec.homework)]}`}>BTVN {rec.homework}%</span>
                          )}
                          {rec.attitude && (
                            <span className={`rounded-full px-2 py-0.5 ${rec.attitude === "good" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                              {ATTITUDE_LABELS[rec.attitude]}
                            </span>
                          )}
                          {score && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">{score.replace(`${session.testName} `, "").replace(/\.$/, "")}</span>}
                          {rec.tags.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{rec.tags.length} thẻ</span>}
                          {rec.homework === null && !rec.attitude && rec.tags.length === 0 && !score && (
                            <span className="text-slate-400">Chạm để ghi nhận xét ›</span>
                          )}
                        </div>
                      </button>
                    </Card>
                  </li>
                );
              })}
            </ul>
            <Button variant="secondary" className="w-full" onClick={() => setGuest(true)}>+ Thêm học sinh lớp khác (học bù)</Button>
          </>
        )}

        <div className="pb-6 pt-2">
          {!confirmDelete ? (
            <button type="button" className="w-full py-3 text-[15px] text-red-600" onClick={() => setConfirmDelete(true)}>Xóa buổi này</button>
          ) : (
            <Card className="space-y-2 !bg-red-50">
              <p className="text-[15px] text-red-700">Xóa hẳn buổi này và toàn bộ điểm danh, nhận xét của buổi? (Nếu cô cho nghỉ, nên bấm &quot;Nghỉ cả lớp&quot; thay vì xóa.)</p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>Không</Button>
                <Button variant="danger" className="flex-1 !bg-red-600 !text-white" onClick={() => {
                  void deleteSession(session.id);
                  router.replace(`/buoi-hoc?lop=${classId}`);
                }}>Xóa</Button>
              </div>
            </Card>
          )}
          <p className="text-center text-sm text-muted">
            <Link href={`/buoi-hoc?lop=${classId}`} className="text-brand-700 underline">Các buổi học của {classRoom.name}</Link>
          </p>
        </div>
      </div>

      {open && (
        <StudentRecordSheet
          key={open.sid}
          session={session}
          student={open.student}
          record={open.rec}
          tags={settings.commentTags}
          position={`${openIndex + 1}/${rows.length}`}
          onPrev={openIndex > 0 ? () => setOpenId(rows[openIndex - 1].sid) : undefined}
          onNext={openIndex < rows.length - 1 ? () => setOpenId(rows[openIndex + 1].sid) : undefined}
          onClose={() => setOpenId(null)}
          onApplyAll={(rec) => {
            setOpenId(null);
            setBulk({ homework: rec.homework, attitude: rec.attitude, addTags: rec.tags });
          }}
          onEditTags={() => setEditTags(true)}
        />
      )}
      {bulk && (
        <BulkApplySheet tags={settings.commentTags} attendingCount={sum.attending} initial={bulk} onApply={applyAll} onClose={() => setBulk(null)} />
      )}
      {editTags && <TagEditorSheet tags={settings.commentTags} onClose={() => setEditTags(false)} />}
      {guest && (
        <GuestSheet
          students={students}
          classById={classById}
          excludeIds={new Set(Object.keys(session.records))}
          onClose={() => setGuest(false)}
          onPick={(s) => {
            setRec(s.id, { ...emptyRecord("makeup"), guest: true });
            setGuest(false);
            toast.show(`Đã thêm ${s.name} học bù`);
          }}
        />
      )}
      {toast.node}
    </>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AttendanceView />
    </Suspense>
  );
}
