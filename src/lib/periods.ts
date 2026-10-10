/** Kỳ thu học phí mặc định: T9–T10, T11–T12, T1–T2, T3–T4, T5–T6. */
export const DEFAULT_FEE_PERIODS: number[][] = [[9, 10], [11, 12], [1, 2], [3, 4], [5, 6]];

export interface Period {
  /** Ví dụ "2026-09_2026-10" */
  id: string;
  /** Các tháng dạng "YYYY-MM", theo thứ tự. */
  months: string[];
  /** "T9-10" — dùng trong nội dung chuyển khoản. */
  short: string;
  /** "Tháng 9 + 10/2026" */
  label: string;
  /** Ngày đầu / cuối kỳ (YYYY-MM-DD). */
  from: string;
  to: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function lastDay(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function makePeriod(year: number, monthList: number[]): Period {
  // Kỳ có thể vắt sang năm sau (ví dụ T12–T1): tháng nhỏ hơn tháng đầu thì thuộc năm sau.
  const first = monthList[0];
  const ym = monthList.map((m) => ({ y: m < first ? year + 1 : year, m }));
  const months = ym.map(({ y, m }) => `${y}-${pad(m)}`);
  const last = ym[ym.length - 1];
  const short = `T${monthList.join("-")}`;
  const yearText = ym[0].y === last.y ? `${last.y}` : `${ym[0].y}-${last.y}`;
  return {
    id: months.join("_"),
    months,
    short,
    label: `Tháng ${monthList.join(" + ")}/${yearText}`,
    from: `${months[0]}-01`,
    to: `${months[months.length - 1]}-${pad(lastDay(last.y, last.m))}`,
  };
}

/** Kỳ chứa ngày `iso`. Tháng không thuộc kỳ nào (ví dụ hè T7, T8) thành kỳ 1 tháng. */
export function periodOf(iso: string, periods: number[][] = DEFAULT_FEE_PERIODS): Period {
  const [y, m] = iso.split("-").map(Number);
  for (const list of periods) {
    const idx = list.indexOf(m);
    if (idx === -1) continue;
    // Năm của tháng đầu kỳ.
    const startYear = list[0] > m ? y - 1 : y;
    return makePeriod(startYear, list);
  }
  return makePeriod(y, [m]);
}

/** Kỳ liền trước / liền sau. */
export function shiftPeriod(p: Period, dir: -1 | 1, periods: number[][] = DEFAULT_FEE_PERIODS): Period {
  if (dir === 1) {
    const [y, m] = p.to.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
    return periodOf(next, periods);
  }
  const [y, m] = p.from.split("-").map(Number);
  const prev = m === 1 ? `${y - 1}-12-01` : `${y}-${pad(m - 1)}-01`;
  return periodOf(prev, periods);
}

/** "2026-09" → "T9/2026" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `T${m}/${y}`;
}
