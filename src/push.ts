import { api } from "./api";

const b64 = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };

export const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export async function enablePush() {
  if (!pushSupported()) throw new Error("This browser does not support push notifications");
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Notification permission was not granted");
  const { key } = await api("/api/push/key");
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) as unknown as BufferSource }));
  await api("/api/push/subscribe", { json: sub.toJSON() });
}
