import { Navigate, Route, Routes } from "react-router-dom";
import { Center } from "@chakra-ui/react";
import { useAuth } from "./auth";
import { Loading } from "./components/ui";
import { NavItem, Shell } from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Privacy from "./pages/Privacy";
import { Home, Assignment, Swaps, Exits, Attendance, Complaints, Inbox, MyPlatoon } from "./pages/member";
import { Overview, Streams, Members, Hostels, AttendanceAdmin, ExitsAdmin, Engagement, Reports } from "./pages/director";
import QRPage from "./pages/QRPage";
import { PlatoonsAdmin, OfficerDashboard } from "./pages/platoons";

const memberNav: NavItem[] = [
  { to: "/app", label: "Home", icon: "home" }, { to: "/app/assignment", label: "My bed", icon: "bed" }, { to: "/app/attendance", label: "Attendance", icon: "camera" },
  { to: "/app/platoon", label: "My platoon", icon: "users" }, { to: "/app/exit", label: "Exit", icon: "door" }, { to: "/app/swaps", label: "Bunk swap", icon: "swap" }, { to: "/app/complaints", label: "Complaints", icon: "chat" }, { to: "/app/inbox", label: "Inbox", icon: "bell" }];
const memberBottom = ["/app", "/app/assignment", "/app/attendance", "/app/platoon", "/app/inbox"];
const dirNav: NavItem[] = [
  { to: "/director", label: "Overview", icon: "chart" }, { to: "/director/qr", label: "Registration QR", icon: "qr" }, { to: "/director/streams", label: "Streams", icon: "layers" }, { to: "/director/members", label: "Corps members", icon: "users" },
  { to: "/director/hostels", label: "Hostels & beds", icon: "building" }, { to: "/director/attendance", label: "Attendance", icon: "camera" }, { to: "/director/exits", label: "Exits", icon: "door" },
  { to: "/director/platoons", label: "Platoons", icon: "users" },
  { to: "/director/engage", label: "Complaints & notices", icon: "chat" }, { to: "/director/reports", label: "Reports", icon: "file" }, { to: "/director/inbox", label: "Inbox", icon: "bell" }];
const dirBottom = ["/director", "/director/qr", "/director/members", "/director/attendance", "/director/inbox"];

function Guard({ role, children }: { role: "member" | "director" | "platoon_officer"; children: JSX.Element }) {
  const { me, loading } = useAuth();
  if (loading) return <Center h="100vh"><Loading /></Center>;
  if (!me) return <Navigate to="/login" replace />;
  return me.role === role ? children : <Navigate to={me.role === "director" ? "/director" : me.role === "platoon_officer" ? "/officer" : "/app"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/privacy" element={<Privacy />} />
      <Route path="/app" element={<Guard role="member"><Shell nav={memberNav} bottom={memberBottom} title="Keffi Camp" /></Guard>}>
        <Route index element={<Home />} /><Route path="assignment" element={<Assignment />} /><Route path="swaps" element={<Swaps />} />
        <Route path="exit" element={<Exits />} /><Route path="platoon" element={<MyPlatoon />} /><Route path="attendance" element={<Attendance />} /><Route path="complaints" element={<Complaints />} /><Route path="inbox" element={<Inbox />} />
      </Route>
      <Route path="/director" element={<Guard role="director"><Shell nav={dirNav} bottom={dirBottom} title="Camp Director" /></Guard>}>
        <Route index element={<Overview />} /><Route path="qr" element={<QRPage />} /><Route path="streams" element={<Streams />} /><Route path="members" element={<Members />} /><Route path="hostels" element={<Hostels />} />
        <Route path="attendance" element={<AttendanceAdmin />} /><Route path="exits" element={<ExitsAdmin />} /><Route path="engage" element={<Engagement />} /><Route path="reports" element={<Reports />} /><Route path="inbox" element={<Inbox />} />
        <Route path="platoons" element={<PlatoonsAdmin />} />
      </Route>
      <Route path="/officer" element={<Guard role="platoon_officer"><Shell nav={[{ to: "/officer", label: "My platoon", icon: "users" }]} bottom={["/officer"]} title="Platoon Officer" /></Guard>}>
        <Route index element={<OfficerDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
