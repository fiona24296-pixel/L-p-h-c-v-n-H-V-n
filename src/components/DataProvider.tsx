"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { COL, seedDefaultClasses, toStudent } from "@/lib/db";
import { getDb } from "@/lib/firebase";
import type { ClassRoom, Student } from "@/lib/types";

interface Data {
  loading: boolean;
  classes: ClassRoom[];
  students: Student[];
  classById: Map<string, ClassRoom>;
  error?: string;
}

const DataContext = createContext<Data | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData phải nằm trong DataProvider");
  return ctx;
}

/** Đồng bộ realtime danh sách lớp + học sinh cho toàn app (máy nào sửa, máy khác thấy ngay). */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<ClassRoom[] | null>(null);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState<string>();
  const seeded = useRef(false);

  useEffect(() => {
    const db = getDb();
    const onErr = () => setError("Không tải được dữ liệu. Cô kiểm tra mạng rồi mở lại app nhé.");
    const unsubClasses = onSnapshot(
      collection(db, COL.classes),
      (snap) => {
        // Lần đầu dùng app: tự tạo 6 lớp theo lịch.
        if (snap.empty && !snap.metadata.fromCache && !seeded.current) {
          seeded.current = true;
          void seedDefaultClasses();
        }
        const list = snap.docs.map((d) => ({ ...(d.data() as Omit<ClassRoom, "id">), id: d.id }));
        setClasses(list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "vi")));
      },
      onErr,
    );
    const unsubStudents = onSnapshot(
      collection(db, COL.students),
      (snap) => {
        const list = snap.docs.map((d) => toStudent(d.id, d.data() as Partial<Student>));
        setStudents(list.sort((a, b) => a.id.localeCompare(b.id, "vi", { numeric: true })));
      },
      onErr,
    );
    return () => {
      unsubClasses();
      unsubStudents();
    };
  }, []);

  const value = useMemo<Data>(() => {
    const cls = classes ?? [];
    return {
      loading: classes === null || students === null,
      classes: cls,
      students: students ?? [],
      classById: new Map(cls.map((c) => [c.id, c])),
      error,
    };
  }, [classes, students, error]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
