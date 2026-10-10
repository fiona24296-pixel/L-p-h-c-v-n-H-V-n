// Bộ biểu tượng nét (24×24), dùng currentColor.
type P = { className?: string };
const base = (path: React.ReactNode, className = "h-6 w-6") => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
    strokeLinejoin="round" className={className} aria-hidden="true">{path}</svg>
);

export const IconToday = ({ className }: P) =>
  base(<><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 15 2 2 4-4" /></>, className);
export const IconClasses = ({ className }: P) =>
  base(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>, className);
export const IconMoney = ({ className }: P) =>
  base(<><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></>, className);
export const IconChart = ({ className }: P) =>
  base(<><path d="M3 3v18h18" /><path d="M7 15v2M12 10v7M17 6v11" /></>, className);
export const IconSettings = ({ className }: P) =>
  base(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>, className);
export const IconSearch = ({ className }: P) => base(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>, className);
export const IconPlus = ({ className }: P) => base(<path d="M12 5v14M5 12h14" />, className);
export const IconClose = ({ className }: P) => base(<path d="M18 6 6 18M6 6l12 12" />, className);
export const IconPhone = ({ className }: P) =>
  base(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />, className);
export const IconUpload = ({ className }: P) => base(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></>, className);
export const IconDownload = ({ className }: P) => base(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>, className);
export const IconClock = ({ className }: P) => base(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, className);
export const IconChevron = ({ className }: P) => base(<path d="m9 18 6-6-6-6" />, className);
export const IconLogout = ({ className }: P) => base(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>, className);
