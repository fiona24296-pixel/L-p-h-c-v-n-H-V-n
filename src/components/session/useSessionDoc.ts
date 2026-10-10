"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { sessionRef } from "@/lib/db";
import { toSession } from "@/lib/session";
import type { ClassSession } from "@/lib/types";

export interface SessionDocState {
  loading: boolean;
  exists: boolean;
  session: ClassSession | null;
  /** Còn thay đổi chưa lên máy chủ (mạng yếu). */
  pending: boolean;
  fromCache: boolean;
}

/** Theo dõi realtime 1 buổi học. Thay đổi trên máy này hiện ngay, máy khác thấy sau vài giây. */
export function useSessionDoc(id: string | null): SessionDocState {
  const [state, setState] = useState<SessionDocState>({ loading: true, exists: false, session: null, pending: false, fromCache: true });
  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      sessionRef(id),
      { includeMetadataChanges: true },
      (snap) =>
        setState({
          loading: false,
          exists: snap.exists(),
          session: snap.exists() ? toSession(snap.id, snap.data()) : null,
          pending: snap.metadata.hasPendingWrites,
          fromCache: snap.metadata.fromCache,
        }),
      () => setState((s) => ({ ...s, loading: false })),
    );
  }, [id]);
  return state;
}
