import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, hasToken, setToken } from "./api";

type AppRole = "member" | "director" | "platoon_officer";
type Me = { role: AppRole; profile?: any; username?: string; platoon?: number } | null;
const Ctx = createContext<{ me: Me; loading: boolean; login: (i: string, p: string) => Promise<AppRole>; logout: () => void }>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(hasToken());
  useEffect(() => { if (hasToken()) api("/api/auth/me").then(setMe).catch(() => setToken("")).finally(() => setLoading(false)); }, []);
  const login = async (identifier: string, password: string) => {
    const r = await api("/api/auth/login", { json: { identifier, password } });
    setToken(r.token); setMe(await api("/api/auth/me")); return r.role;
  };
  return <Ctx.Provider value={{ me, loading, login, logout: () => { setToken(""); setMe(null); } }}>{children}</Ctx.Provider>;
}
