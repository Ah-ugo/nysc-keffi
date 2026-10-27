const P: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  bed: "M3 20V6M3 14h18v6M21 14v-2a3 3 0 00-3-3h-7v5M7 11h.01",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
  door: "M6 21V4l10-2v19M6 21h13M13 12h.01M3 21h3",
  bell: "M6 17V11a6 6 0 1112 0v6l2 2H4zM10 21h4",
  swap: "M7 7h13l-3-3M17 17H4l3 3",
  chat: "M4 5h16v11H9l-5 4z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  users: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M17 11a2.5 2.5 0 100-5M18 14c2.2.4 4 2.2 4 5",
  building: "M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M3 21h18",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h3v-3",
  file: "M6 3h8l5 5v13H6zM14 3v5h5M9 13h6M9 17h6",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  logout: "M10 4H4v16h6M16 8l4 4-4 4M20 12H9",
  check: "M5 12l5 5 9-10",
  print: "M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z",
};
export const Icon = ({ n, size = 20 }: { n: keyof typeof P | string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n] ?? P.file} /></svg>
);
