"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocsFromServer,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { DEFAULT_CLASSES } from "./defaults";
import type { ImportResult } from "./excel-import";
import { getDb } from "./firebase";
import type { ClassRoom, Student } from "./types";

export const COL = {
  classes: "classes",
  students: "students",
} as const;

export function emptyStudent(classRoom?: ClassRoom): Student {
  return {
    id: "", name: "", classId: classRoom?.id ?? "", grade: classRoom?.grade ?? "6", school: "", schoolClass: "",
    parentName: "", zalo: "", phone: "", feeMethod: classRoom?.feeMode === "per_session" ? "per_session" : "monthly",
    note: "", needsCheck: "", status: "active", discountPercent: 0,
  };
}

/** Chuẩn hóa dữ liệu đọc từ Firestore (thiếu trường thì lấy mặc định). */
export function toStudent(id: string, data: Partial<Student>): Student {
  return { ...emptyStudent(), ...data, id };
}

export async function saveStudent(s: Student) {
  const { id, ...data } = s;
  await setDoc(doc(getDb(), COL.students, id), { ...data, updatedAt: Date.now() });
}

export async function deleteStudent(id: string) {
  await deleteDoc(doc(getDb(), COL.students, id));
}

export async function saveClass(c: ClassRoom) {
  const { id, ...data } = c;
  await setDoc(doc(getDb(), COL.classes, id), data);
}

export async function seedDefaultClasses() {
  const db = getDb();
  const batch = writeBatch(db);
  for (const { id, ...data } of DEFAULT_CLASSES) batch.set(doc(db, COL.classes, id), data);
  await batch.commit();
}

/** Ghi nhiều thao tác, tự chia nhỏ theo giới hạn 500 thao tác/lần của Firestore. */
async function commitInChunks(db: Firestore, ops: ((b: ReturnType<typeof writeBatch>) => void)[]) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}

export interface ImportSummary {
  created: number;
  updated: number;
  classesWritten: number;
}

/**
 * Ghi kết quả nhập Excel: "Mã HS" là khóa — đã có thì cập nhật thông tin trong file
 * (giữ nguyên trạng thái nghỉ học, % miễn giảm…), chưa có thì tạo mới.
 */
export async function applyImport(result: ImportResult, existing: Student[], existingClasses: ClassRoom[]): Promise<ImportSummary> {
  const db = getDb();
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = [];
  let classesWritten = 0;
  if (result.hasClassSheet || existingClasses.length === 0) {
    for (const { id, ...data } of result.classes) {
      ops.push((b) => b.set(doc(db, COL.classes, id), data, { merge: true }));
      classesWritten++;
    }
  }
  // Lấy danh sách mới nhất từ máy chủ để không ghi đè nhầm.
  let known = new Set(existing.map((s) => s.id));
  try {
    const snap = await getDocsFromServer(collection(db, COL.students));
    known = new Set(snap.docs.map((d) => d.id));
  } catch {
    /* mất mạng: dùng danh sách đang có */
  }
  let created = 0;
  let updated = 0;
  const now = Date.now();
  for (const { id, ...data } of result.students) {
    const ref = doc(db, COL.students, id);
    if (known.has(id)) {
      updated++;
      ops.push((b) => b.set(ref, { ...data, updatedAt: now }, { merge: true }));
    } else {
      created++;
      ops.push((b) => b.set(ref, { ...data, status: "active", discountPercent: 0, updatedAt: now }));
    }
  }
  await commitInChunks(db, ops);
  return { created, updated, classesWritten };
}
