const BASE = (import.meta.env.VITE_API_URL as string) ?? "https://nysc-keffi-be.vercel.app";
let token = sessionStorage.getItem("t") ?? ""; // session token only; no personal/biometric data is stored in the browser

export const setToken = (t: string) => { token = t; t ? sessionStorage.setItem("t", t) : sessionStorage.removeItem("t"); };
export const hasToken = () => !!token;

type Opts = { method?: string; json?: unknown; form?: FormData };
export async function api<T = any>(path: string, o: Opts = {}): Promise<T> {
  if (!navigator.onLine) throw new Error("You are offline. Nothing was submitted.");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (o.json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(o.json); }
  if (o.form) body = o.form;
  const r = await fetch(BASE + path, { method: o.method ?? (body ? "POST" : "GET"), headers, body });
  if (r.status === 401 && token) { setToken(""); location.href = "/login"; }
  if (!r.ok) {
    let msg = `Request failed (${r.status})`;
    try { const j = await r.json(); msg = typeof j.detail === "string" ? j.detail : Array.isArray(j.detail) ? j.detail.map((d: any) => d.msg).join("; ") : msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

export async function download(path: string, filename: string) {
  const r = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Download failed");
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function imageUrl(path: string): Promise<string> {
  const r = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Image unavailable");
  return URL.createObjectURL(await r.blob());
}
