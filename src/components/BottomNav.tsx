"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChart, IconClasses, IconMoney, IconSettings, IconToday } from "./icons";

const TABS = [
  { href: "/", label: "Hôm nay", Icon: IconToday },
  { href: "/lop", label: "Lớp học", Icon: IconClasses },
  { href: "/hoc-phi", label: "Học phí", Icon: IconMoney },
  { href: "/tong-quan", label: "Tổng quan", Icon: IconChart },
  { href: "/cai-dat", label: "Cài đặt", Icon: IconSettings },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 backdrop-blur pb-safe" aria-label="Điều hướng chính">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[13px] font-medium ${
                  active ? "text-brand-600" : "text-slate-500"
                }`}
              >
                <span className={`grid h-8 w-14 place-items-center rounded-full ${active ? "bg-brand-100" : ""}`}>
                  <Icon className="h-6 w-6" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
