import { useCallback, useEffect, useState } from "react";
import { Alert, AlertIcon, Box, Button, Checkbox, Flex, FormControl, FormLabel, Grid, Heading, HStack, Image, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Select, SimpleGrid, Stack, Text, Textarea, useDisclosure } from "@chakra-ui/react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, download, imageUrl } from "../api";
import { Page } from "../components/Layout";
import { Card, DataTable, Empty, ErrorBox, Loading, Pager, Stat, Status, useAction } from "../components/ui";
import { Icon } from "../components/Icon";
import { C } from "../theme";
import { Link } from "react-router-dom";

const fmt = (s?: string) => (s ? new Date(s).toLocaleString() : "-");
const SEL = "sid";

function useStreams() {
  const [streams, setStreams] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [sid, setSidState] = useState(sessionStorage.getItem(SEL) ?? "");
  const reload = useCallback(() => {
    setLoading(true); setError("");
    return api<any[]>("/api/streams").then((s) => { setStreams(s); if (!sid && s[0]) setSid(s[0].id); })
      .catch((e: any) => { setStreams(null); setError(e?.message ?? "Could not load camp streams."); })
      .finally(() => setLoading(false));
  }, [sid]);
  useEffect(() => { reload(); }, []);
  const setSid = (v: string) => { sessionStorage.setItem(SEL, v); setSidState(v); };
  const current = streams?.find((s) => s.id === sid);
  return { streams, sid, setSid, current, reload, loading, error };
}
const Picker = ({ h }: { h: ReturnType<typeof useStreams> }) => (
  !h.streams ? (h.loading ? <Loading /> : <ErrorBox msg={h.error || "Camp streams could not be loaded."} />) :
  <HStack className="no-print"><Text fontSize="sm">Stream:</Text>
    <Select maxW="320px" bg="white" value={h.sid} onChange={(e) => h.setSid(e.target.value)}>{h.streams?.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.status})</option>)}</Select>
    {h.current?.status === "closed" && <Status s="closed" />}</HStack>
);
function useData<T>(path: string | null) {
  const [d, setD] = useState<T | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const load = useCallback(() => {
    if (!path) { setD(null); setLoading(false); return; }
    setLoading(true); setError("");
    api<T>(path).then(setD).catch((e: any) => { setD(null); setError(e?.message ?? "Could not load this information."); }).finally(() => setLoading(false));
  }, [path]);
  useEffect(() => { setD(null); load(); }, [load]);
  return { d, load, loading, error };
}
const NoStream = () => <Empty>Create a stream first (Streams page).</Empty>;


export function Overview() {
  const h = useStreams();
  const [f, setF] = useState({ from: "", to: "", week: "", hostel: "" });
  const qs = (extra = "") => { const p = new URLSearchParams({ stream_id: h.sid }); if (f.from) p.set("date_from", new Date(f.from).toISOString()); if (f.to) p.set("date_to", new Date(f.to + "T23:59:59").toISOString()); if (f.week) p.set("week", f.week); if (f.hostel) p.set("hostel_code", f.hostel); return "?" + p.toString() + extra; };
  const on = !!h.sid;
  const reg = useData<any>(on ? `/api/analytics/registration${qs()}` : null), hos = useData<any>(on ? `/api/analytics/hostel${qs()}` : null), att = useData<any>(on ? `/api/analytics/attendance${qs()}` : null),
    ex = useData<any>(on ? `/api/analytics/exits${qs()}` : null), cp = useData<any>(on ? `/api/analytics/complaints${qs()}` : null);
  if (!h.streams) return h.loading ? <Loading /> : <ErrorBox msg={h.error || "Camp streams could not be loaded."} />;
  const pct = (a?: number | null) => (a == null ? "n/a" : `${a}%`);
  const analytics = [reg, hos, att, ex, cp];
  const analyticsErrors = analytics.filter((x) => x.error).map((x) => x.error);
  const exitStages = ex.d?.by_status ?? {};
  const exitPending = ["submitted", "awaiting_platoon_confirmation", "awaiting_document_review", "awaiting_director_decision", "more_info_required"].reduce((n, s) => n + (exitStages[s] || 0), 0);
  const attention: [string, number | undefined, string][] = [["Registrations to verify", reg.d?.by_status?.pending_verification, "/director/members"], ["Attendance needing review", att.d?.pending_manual_review, "/director/attendance"], ["Exit requests pending", exitPending, "/director/exits"], ["Overdue returns", ex.d?.overdue, "/director/exits"], ["Open complaints", cp.d?.outstanding, "/director/engage"]];
  const cat = Object.entries(cp.d?.by_category ?? {}).map(([k, v]) => ({ k, v }));
  return (
    <Page title="Camp overview" sub="Every figure is calculated from live records; definitions are shown under each chart." actions={<Button variant="outline" leftIcon={<Icon n="print" size={16} />} onClick={() => window.print()}>Print</Button>}>
      <Picker h={h} />
      {!h.sid ? <NoStream /> : <>
        {analytics.some((x) => x.loading) && <Loading />}
        {analyticsErrors.length > 0 && <ErrorBox msg={analyticsErrors[0]} />}
        <HStack className="no-print" wrap="wrap" align="flex-end" bg="white" p={3} borderWidth="1px" borderColor={C.line}>
          <FormControl maxW="170px"><FormLabel>From</FormLabel><Input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></FormControl>
          <FormControl maxW="170px"><FormLabel>To</FormLabel><Input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></FormControl>
          <FormControl maxW="110px"><FormLabel>Week</FormLabel><Input type="number" value={f.week} onChange={(e) => setF({ ...f, week: e.target.value })} /></FormControl>
          <FormControl maxW="140px"><FormLabel>Hostel</FormLabel><Input placeholder="e.g. M1" value={f.hostel} onChange={(e) => setF({ ...f, hostel: e.target.value })} /></FormControl>
          <Button variant="ghost" onClick={() => setF({ from: "", to: "", week: "", hostel: "" })}>Clear</Button></HStack>
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3}>
          {attention.map(([l, v, to]) => <Link key={l} to={to}><Stat label={l} value={v ?? 0} color={(v ?? 0) > 0 ? C.amber : C.green} /></Link>)}</SimpleGrid>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          <Stat label="Registered" value={reg.d?.total} note={`${reg.d?.by_status?.verified ?? 0} verified`} />
          <Stat label="Beds: occupied / reserved" value={hos.d ? `${hos.d.occupied} / ${hos.d.reserved}` : "-"} note={`${hos.d?.available ?? 0} available of ${hos.d?.capacity ?? 0}`} color={C.khaki} />
          <Stat label="Face pass rate" value={pct(att.d?.face_pass_rate)} note={`Location pass ${pct(att.d?.location_pass_rate)}`} />
          <Stat label="Away now" value={ex.d?.currently_away} note={`${ex.d?.beds_released ?? 0} beds released via exits`} color={C.blue} /></SimpleGrid>
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
          <Card><Heading size="md" mb={2}>Occupancy by hostel</Heading>{hos.d?.per_hostel?.length ? <ResponsiveContainer width="100%" height={240}><BarChart data={hos.d.per_hostel}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hostel" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="occupied" stackId="a" fill={C.green} /><Bar dataKey="reserved" stackId="a" fill={C.amber} /><Bar dataKey="available" stackId="a" fill="#cfd8d2" /></BarChart></ResponsiveContainer> : <Text color="gray.600">No hostels.</Text>}<Text fontSize="xs" color="gray.600" mt={2}>{hos.d?.definition}</Text></Card>
          <Card><Heading size="md" mb={2}>Attendance rate by week (%)</Heading>{att.d?.weeks?.length ? <ResponsiveContainer width="100%" height={240}><BarChart data={att.d.weeks}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="attendance_rate" fill={C.green} /></BarChart></ResponsiveContainer> : <Text color="gray.600">No attendance data yet.</Text>}<Text fontSize="xs" color="gray.600" mt={2}>{att.d?.definition}</Text></Card>
          <Card><Heading size="md" mb={2}>Registrations per day</Heading>{reg.d?.trend?.length ? <ResponsiveContainer width="100%" height={220}><BarChart data={reg.d.trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill={C.khaki} /></BarChart></ResponsiveContainer> : <Text color="gray.600">No registrations in range.</Text>}</Card>
          <Card><Heading size="md" mb={2}>Complaints by category</Heading>{cat.length ? <ResponsiveContainer width="100%" height={220}><BarChart data={cat}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="k" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="v" fill={C.blue} /></BarChart></ResponsiveContainer> : <Text color="gray.600">No complaints.</Text>}
            <Text fontSize="sm" mt={2}>Avg resolution {cp.d?.avg_resolution_hours ?? "n/a"} h · over 7 days {cp.d?.overdue_over_7_days ?? 0} · notification failures {cp.d?.notifications?.with_failed_delivery ?? 0}/{cp.d?.notifications?.total ?? 0}</Text></Card>
        </Grid>
        <Card><Heading size="md" mb={2}>Automated results and Camp Director decisions</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            {[["Face checks", att.d?.automated_results?.face, { passed: "Matched", failed: "No match", review: "Needs review" }], ["Location checks", att.d?.automated_results?.location, { passed: "Within camp area", failed: "Outside camp area", review: "Needs review" }], ["Final decisions", att.d?.source, { automatic: "Automatic", administrative_override: "Camp Director decision", policy: "Attendance policy" }]].map(([heading, counts, labels]: any) => <Box key={heading} borderWidth="1px" borderColor={C.line} p={3}><Text fontWeight="600" mb={1}>{heading}</Text>{counts && Object.keys(counts).length ? Object.entries(counts).map(([key, count]) => <Text key={key} fontSize="sm">{labels[key] || key.replace(/_/g, " ")}: {count as any}</Text>) : <Text fontSize="sm" color="gray.600">No results in this period.</Text>}</Box>)}
          </SimpleGrid>
          {att.d?.not_submitted && <Text fontSize="sm" mt={2}>Not submitted this week ({att.d.not_submitted.length}): {att.d.not_submitted.slice(0, 40).join(", ")}{att.d.not_submitted.length > 40 ? "…" : ""}</Text>}
          <Text fontSize="xs" color="gray.500" mt={2}>Generated {fmt(att.d?.generated_at)}</Text></Card></>}
    </Page>
  );
}

export function Streams() {
  const h = useStreams(); const act = useAction();
  const [f, setF] = useState({ year: new Date().getFullYear(), batch: "A", number: 1, status: "upcoming" });
  const rev = useData<any[]>(h.sid ? `/api/streams/${h.sid}/closure-review` : null);
  if (!h.streams) return h.loading ? <Loading /> : <ErrorBox msg={h.error || "Camp streams could not be loaded."} />;
  const setStatus = (id: string, status: string) => act(() => api(`/api/streams/${id}/status`, { method: "PATCH", json: { status } }), "Stream updated", () => { h.reload(); rev.load(); });
  return (
    <Page title="Batches and streams">
      <Card><HStack align="flex-end" wrap="wrap">
        <FormControl maxW="110px"><FormLabel>Year</FormLabel><Input type="number" value={f.year} onChange={(e) => setF({ ...f, year: +e.target.value })} /></FormControl>
        <FormControl maxW="90px"><FormLabel>Batch</FormLabel><Input value={f.batch} maxLength={2} onChange={(e) => setF({ ...f, batch: e.target.value })} /></FormControl>
        <FormControl maxW="90px"><FormLabel>Stream</FormLabel><Input type="number" value={f.number} onChange={(e) => setF({ ...f, number: +e.target.value })} /></FormControl>
        <Select maxW="150px" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option>upcoming</option><option>active</option><option>suspended</option></Select>
        <Button isLoading={act.busy} onClick={() => act(() => api("/api/streams", { json: f }), "Stream created", h.reload)}>Create {f.year} Batch {f.batch.toUpperCase()} Stream {f.number}</Button></HStack></Card>
      <DataTable rows={h.streams} cols={[["Stream", (r) => r.label], ["Status", (r) => <Status s={r.status} />],
        ["Change status", (r) => r.status === "closed" ? <Text fontSize="sm">Archived (read-only)</Text> : <HStack>{["active", "suspended", "closed"].filter((s) => s !== r.status).map((s) => <Button key={s} size="xs" variant="outline" onClick={() => { if (s !== "closed" || confirm("Close this stream? Records are kept; outstanding beds and exits go to a review list.")) setStatus(r.id, s); }}>{s}</Button>)}</HStack>]]} />
      {h.current?.status === "closed" && <><Heading size="lg">Closure review: {h.current.label}</Heading><Picker h={h} />
        <Card><Text fontWeight={700}>Retention</Text><Text fontSize="sm" mb={2}>After every item below is reviewed, permanently delete enrolment photos and attendance selfies for this stream. Attendance results and the audit trail are kept.</Text>
          <Button colorScheme="red" variant="outline" onClick={() => confirm("Permanently delete ALL face photos for this stream? This cannot be undone.") && act(() => api(`/api/streams/${h.sid}/purge-biometrics`, { method: "POST" }), "Purge started")}>Delete biometric images</Button></Card>
        <DataTable empty="No outstanding items." rows={(rev.d ?? []).filter((i) => !i.resolved)} cols={[["Type", (r) => r.type.replace("_", " ")], ["Call-up", (r) => r.callup], ["Reference", (r) => r.ref], ["", (r) => <Button size="xs" onClick={() => act(() => api(`/api/closure-review/${r.id}/resolve`, { method: "POST" }), "Resolved", rev.load)}>Mark reviewed</Button>]]} /></>}
    </Page>
  );
}

export function Members() {
  const h = useStreams(); const act = useAction(); const [q, setQ] = useState(""); const [page, setPage] = useState(1); const [st, setSt] = useState("");
  const { d, load, loading, error } = useData<any>(h.sid ? `/api/members?stream_id=${h.sid}&q=${encodeURIComponent(q)}&page=${page}&size=25${st ? `&status=${st}` : ""}` : null);
  const [photos, setPhotos] = useState<{ front?: string; side?: string; who?: string }>({}); const [photoLoading, setPhotoLoading] = useState(false); const [photoError, setPhotoError] = useState(""); const dlg = useDisclosure();
  const view = async (c: string) => {
    setPhotos({ who: c }); setPhotoError(""); setPhotoLoading(true); dlg.onOpen();
    try { const [front, side] = await Promise.all([imageUrl(`/api/members/${encodeURIComponent(c)}/photo/front`), imageUrl(`/api/members/${encodeURIComponent(c)}/photo/side`)]); setPhotos({ who: c, front, side }); }
    catch { setPhotoError("Could not load the enrolment photos. Please try again."); }
    finally { setPhotoLoading(false); }
  };
  const fix = (c: string) => { const n = prompt(`Correct call-up number for ${c}:`); const reason = n && prompt("Reason for correction:"); if (n && reason) act(() => api(`/api/members/${encodeURIComponent(c)}/correct-callup`, { json: { new_callup: n, reason } }), "Call-up corrected", load); };
  return (
    <Page title="Corps members" actions={<Button variant="outline" onClick={() => act(() => download(`/api/reports/members.csv?stream_id=${h.sid}`, "members.csv"))}>Export CSV</Button>}>
      <Picker h={h} />
      <HStack><Input bg="white" placeholder="Search call-up number or name" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select bg="white" maxW="220px" value={st} onChange={(e) => setSt(e.target.value)}><option value="">All statuses</option><option value="pending_verification">Pending verification</option><option value="verified">Verified</option><option value="rejected">Rejected</option></Select></HStack>
      {!d ? (loading ? <Loading /> : <ErrorBox msg={error || "Could not load corps members."} />) : <><DataTable rows={d.items} cols={[["Call-up", (r) => r.callup], ["Name", (r) => r.full_name], ["Gender", (r) => r.gender], ["State", (r) => r.state], ["Registration", (r) => <Status s={r.registration_status} />], ["Biometric", (r) => <Status s={r.biometric_status} />],
        ["Actions", (r) => <HStack><Button size="xs" variant="outline" isLoading={photoLoading && photos.who === r.callup} onClick={() => view(r.callup)}>Photos</Button><Button size="xs" isLoading={act.busy} onClick={() => act(() => api(`/api/members/${encodeURIComponent(r.callup)}/verify`, { json: { decision: "verified" } }), "Verified", load)}>Verify</Button><Button size="xs" isLoading={act.busy} colorScheme="red" variant="outline" onClick={() => act(() => api(`/api/members/${encodeURIComponent(r.callup)}/verify`, { json: { decision: "rejected" } }), "Rejected", load)}>Reject</Button><Button size="xs" variant="ghost" onClick={() => fix(r.callup)}>Fix call-up</Button></HStack>]]} />
        <Pager page={page} total={d.total} size={25} set={setPage} /></>}
      <Modal isOpen={dlg.isOpen} onClose={dlg.onClose} size="xl"><ModalOverlay /><ModalContent><ModalHeader>Enrolment photos: {photos.who}</ModalHeader><ModalCloseButton /><ModalBody pb={6}>{photoLoading ? <Loading /> : photoError ? <ErrorBox msg={photoError} /> : <><SimpleGrid columns={2} spacing={3}><Image src={photos.front} alt="Front" /><Image src={photos.side} alt="Side" /></SimpleGrid><Text fontSize="xs" mt={2}>Viewing biometric images is recorded in the audit log.</Text></>}</ModalBody></ModalContent></Modal>
    </Page>
  );
}

function BunkMap({ hid, onPick }: { hid: string; onPick?: (code: string) => void }) {
  const { d } = useData<any>(hid ? `/api/hostels/${hid}/map` : null);
  if (!hid) return null; if (!d) return <Loading />;
  const col: Record<string, string> = { available: "#ffffff", occupied: C.green, reserved: C.amber, disabled: "#b8bfba" };
  const cell = (b: any) => b && <Box title={`${b.code} · ${b.status}${b.occupant ? ` · ${b.occupant}${b.name ? ` · ${b.name}` : ""}` : ""}`} onClick={onPick ? () => onPick(b.code) : undefined} cursor={onPick ? "pointer" : "default"} h="17px" w="100%" bg={col[b.status]} borderWidth="1px" borderColor="#5b6b61" _hover={onPick ? { outline: `2px solid ${C.forest}` } : undefined} />;
  return (
    <Card><HStack justify="space-between" mb={2} wrap="wrap"><Heading size="md">Hostel {d.hostel} bunk map</Heading>
      <HStack fontSize="sm" spacing={3}>{Object.entries(col).map(([k, v]) => <HStack key={k} spacing={1}><Box w="12px" h="12px" bg={v} borderWidth="1px" borderColor="#5b6b61" /><Text>{k}</Text></HStack>)}{onPick && <Text color="gray.600">upper on top, lower below; click a bed to pick it</Text>}</HStack></HStack>
      <Flex wrap="wrap" gap="5px">{d.bunks.map((b: any) => <Box key={b.bunk} w="30px"><Text fontSize="9px" textAlign="center" color="gray.600">{b.bunk.split("-").pop()}</Text>{cell(b.upper)}<Box h="2px" />{cell(b.lower)}</Box>)}</Flex></Card>
  );
}

export function Hostels() {
  const h = useStreams(); const act = useAction();
  const hs = useData<any[]>(h.sid ? `/api/hostels?stream_id=${h.sid}` : null);
  const [hf, setHf] = useState({ code: "", bunk_count: 100, gender: "M" });
  const [q, setQ] = useState(""); const [hostel, setHostel] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const beds = useData<any>(h.sid ? `/api/beds?stream_id=${h.sid}&q=${encodeURIComponent(q)}&hostel=${hostel}&status=${status}&page=${page}&size=50` : null);
  const [as, setAs] = useState({ callup: "" }); const [mapId, setMapId] = useState("");
  useEffect(() => { if (hs.d?.length && !hs.d.some((x) => x.id === mapId)) setMapId(hs.d[0].id); }, [hs.d]);
  const both = () => { hs.load(); beds.load(); };
  return (
    <Page title="Hostels, bunks and beds" actions={<><Button variant="outline" onClick={() => act(() => download(`/api/reports/occupancy.csv?stream_id=${h.sid}`, "occupancy.csv"))}>CSV</Button><Button variant="outline" onClick={() => act(() => download(`/api/reports/occupancy.pdf?stream_id=${h.sid}`, "occupancy.pdf"))}>PDF</Button></>}>
      <Picker h={h} />
      <Card><Text fontWeight="600" mb={2}>Create hostel (each bunk gets an upper and a lower bed)</Text><HStack align="flex-end" wrap="wrap">
        <FormControl maxW="120px"><FormLabel>Code</FormLabel><Input value={hf.code} onChange={(e) => setHf({ ...hf, code: e.target.value })} placeholder="M1" /></FormControl>
        <FormControl maxW="120px"><FormLabel>Bunks</FormLabel><Input type="number" value={hf.bunk_count} onChange={(e) => setHf({ ...hf, bunk_count: +e.target.value })} /></FormControl>
        <Select maxW="140px" value={hf.gender} onChange={(e) => setHf({ ...hf, gender: e.target.value })}><option value="M">Male</option><option value="F">Female</option></Select>
        <Button isLoading={act.busy} onClick={() => act(() => api("/api/hostels", { json: { ...hf, stream_id: h.sid } }), "Hostel created", both)}>Create ({hf.bunk_count * 2} beds)</Button></HStack></Card>
      {hs.d ? <DataTable rows={hs.d} empty="No hostels in this stream." cols={[["Hostel", (r) => r.code], ["For", (r) => ["F", "FEMALE"].includes(String(r.gender).toUpperCase()) ? "Female corps members" : "Male corps members"], ["Capacity", (r) => r.capacity], ["Occupied", (r) => r.occupied], ["Reserved", (r) => r.reserved], ["Available", (r) => r.available], ["Active", (r) => (r.active ? "Yes" : "No")],
        ["", (r) => <Button size="xs" variant="outline" onClick={() => act(() => api(`/api/hostels/${r.id}`, { method: "PATCH", json: { active: !r.active } }), "Updated", both)}>{r.active ? "Deactivate" : "Activate"}</Button>]]} />
        : hs.loading ? <Loading /> : <ErrorBox msg={hs.error || "Could not load hostels."} />}
      {hs.d && hs.d.length > 0 && <><Select bg="white" maxW="220px" value={mapId} onChange={(e) => setMapId(e.target.value)}>{hs.d.map((x) => <option key={x.id} value={x.id}>Map: {x.code}</option>)}</Select><BunkMap key={mapId + beds.d?.total} hid={mapId} /></>}
      <Card><Text fontWeight="600" mb={2}>Bed assignment exceptions</Text><Text fontSize="sm" color="gray.600" mb={3}>Beds are assigned automatically when registration is verified. Use these actions only to correct or release an assignment.</Text><HStack wrap="wrap">
        <Input maxW="240px" placeholder="Call-up number" value={as.callup} onChange={(e) => setAs({ callup: e.target.value })} />
        <Button variant="outline" isLoading={act.busy} onClick={() => { const reason = prompt("Reason for reassignment (at least 5 characters):"); if ((reason?.trim().length ?? 0) >= 5) act(() => api("/api/assignments/reassign", { json: { ...as, reason } }), "Reassigned to the next available bed", both); }}>Reassign automatically</Button>
        <Button variant="outline" colorScheme="red" isLoading={act.busy} onClick={() => { const reason = prompt("Reason for releasing the bed (at least 5 characters):"); if ((reason?.trim().length ?? 0) >= 5) act(() => api("/api/assignments/release", { json: { callup: as.callup, reason } }), "Released", both); }}>Release</Button></HStack></Card>
      <HStack><Input bg="white" placeholder="Search call-up, name, bunk or bed" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select bg="white" maxW="160px" value={hostel} onChange={(e) => setHostel(e.target.value)}><option value="">All hostels</option>{hs.d?.map((x) => <option key={x.id}>{x.code}</option>)}</Select>
        <Select bg="white" maxW="160px" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option><option>available</option><option>occupied</option><option>reserved</option><option>disabled</option></Select></HStack>
      {beds.d ? <><DataTable rows={beds.d.items} cols={[["Bed", (r) => r.code], ["Hostel", (r) => r.hostel_code], ["Bunk", (r) => r.bunk], ["Position", (r) => r.position], ["Status", (r) => <Status s={r.status === "available" ? "open" : r.status === "reserved" ? "pending" : r.status === "occupied" ? "active" : "closed"} />], ["Occupant", (r) => r.occupant ?? "-"]]} /><Pager page={page} total={beds.d.total} size={50} set={setPage} /></> : beds.loading ? <Loading /> : <ErrorBox msg={beds.error || "Could not load beds."} />}
    </Page>
  );
}

export function AttendanceAdmin() {
  const h = useStreams(); const act = useAction();
  const sch = useData<any[]>(h.sid ? `/api/attendance/schedules?stream_id=${h.sid}` : null);
  const [week, setWeek] = useState(""); const [status, setStatus] = useState(""); const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const list = useData<any>(h.sid ? `/api/attendance?stream_id=${h.sid}&q=${encodeURIComponent(q)}&page=${page}${week ? `&week=${week}` : ""}${status ? `&status=${status}` : ""}` : null);
  const faceCfg = useData<any>("/api/config/face");
  const [nf, setNf] = useState({ week: 1, opens_at: "", closes_at: "" });
  const [sel, setSel] = useState<any>(null); const [img, setImg] = useState(""); const [imageLoading, setImageLoading] = useState(false); const [imageError, setImageError] = useState(""); const dlg = useDisclosure();
  const [overrideTarget, setOverrideTarget] = useState<string | null>(null); const [overrideReason, setOverrideReason] = useState("");
  const open = async (r: any) => {
    setSel(r); setImg(""); setImageError(""); setImageLoading(!!r.selfie_public_id); dlg.onOpen();
    if (!r.selfie_public_id) return;
    try { setImg(await imageUrl(`/api/attendance/${r.id}/selfie`)); }
    catch { setImageError("Submitted photo is unavailable or has expired."); }
    finally { setImageLoading(false); }
  };
  const over = (new_status: string) => { setOverrideReason(""); setOverrideTarget(new_status); };
  const saveOverride = () => {
    if (!sel || !overrideTarget || overrideReason.trim().length < 5) return;
    act(() => api("/api/attendance/override", { json: { schedule_id: sel.schedule_id, callup: sel.callup, new_status: overrideTarget, reason: overrideReason.trim() } }), "Attendance record updated", () => { setOverrideTarget(null); dlg.onClose(); list.load(); });
  };
  return (
    <Page title="Attendance" actions={<><Button variant="outline" onClick={() => act(() => download(`/api/reports/attendance.csv?stream_id=${h.sid}`, "attendance.csv"))}>CSV</Button><Button variant="outline" onClick={() => act(() => download(`/api/reports/exceptions.pdf?stream_id=${h.sid}`, "exceptions.pdf"))}>Exceptions PDF</Button></>}>
      <Picker h={h} />
      {faceCfg.loading && !faceCfg.d && <Loading />}{faceCfg.error && <ErrorBox msg={faceCfg.error} />}
      {faceCfg.d && <Alert status={faceCfg.d.enabled ? "success" : "warning"} borderRadius="md"><AlertIcon /><Box><Text fontWeight="700">Face verification</Text><Text fontSize="sm">{faceCfg.d.message}</Text>{faceCfg.d.setup_hint && <Text fontSize="sm" mt={1}>{faceCfg.d.setup_hint}</Text>}</Box></Alert>}
      <Card><Text fontWeight="600" mb={2}>Open an attendance window</Text><HStack align="flex-end" wrap="wrap">
        <FormControl maxW="90px"><FormLabel>Week</FormLabel><Input type="number" value={nf.week} onChange={(e) => setNf({ ...nf, week: +e.target.value })} /></FormControl>
        <FormControl maxW="220px"><FormLabel>Opens</FormLabel><Input type="datetime-local" onChange={(e) => setNf({ ...nf, opens_at: e.target.value })} /></FormControl>
        <FormControl maxW="220px"><FormLabel>Closes</FormLabel><Input type="datetime-local" onChange={(e) => setNf({ ...nf, closes_at: e.target.value })} /></FormControl>
        <Button isLoading={act.busy} isDisabled={!nf.opens_at || !nf.closes_at} onClick={() => act(() => api("/api/attendance/schedules", { json: { stream_id: h.sid, week: nf.week, opens_at: new Date(nf.opens_at).toISOString(), closes_at: new Date(nf.closes_at).toISOString() } }), "Window created", sch.load)}>Create</Button></HStack>
        {sch.d ? <Box mt={3}><DataTable rows={sch.d} empty="No windows." cols={[["Week", (r) => r.week], ["Opens", (r) => fmt(r.opens_at)], ["Closes", (r) => fmt(r.closes_at)], ["Finalised", (r) => (r.finalized ? "Yes" : "No")], ["", (r) => !r.finalized && new Date(r.closes_at) < new Date() && <Button size="xs" isLoading={act.busy} onClick={() => confirm("Mark everyone without a record as absent (policy)?") && act(() => api(`/api/attendance/schedules/${r.id}/finalize`, { method: "POST" }), "Finalised", sch.load)}>Finalise</Button>]]} /></Box> : sch.loading ? <Loading /> : <ErrorBox msg={sch.error || "Could not load attendance windows."} />}</Card>
      <HStack wrap="wrap"><Input bg="white" maxW="280px" placeholder="Call-up or name" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /><Input bg="white" maxW="100px" type="number" placeholder="Week" value={week} onChange={(e) => setWeek(e.target.value)} />
        <Select bg="white" maxW="240px" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{["verified_present", "admin_marked_present", "pending_manual_review", "face_failed", "location_failed", "absent"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</Select></HStack>
      {list.d ? <><DataTable rows={list.d.items} cols={[["Wk", (r) => r.week], ["Call-up", (r) => r.callup], ["Status", (r) => <Status s={r.final_status} />], ["Decided by", (r) => (r.status_source === "administrative_override" ? "Camp Director (override)" : r.status_source === "policy" ? "Policy" : "Automatic")], ["Face", (r) => r.face?.result ?? "-"], ["Location", (r) => r.location?.result ?? "-"], ["", (r) => <Button size="xs" variant="outline" onClick={() => open(r)}>Review</Button>]]} /><Pager page={page} total={list.d.total} size={50} set={setPage} /></> : list.loading ? <Loading /> : <ErrorBox msg={list.error || "Could not load attendance records."} />}
      <Modal isOpen={dlg.isOpen} onClose={() => { if (!act.busy) { dlg.onClose(); setOverrideTarget(null); } }} size="xl"><ModalOverlay /><ModalContent><ModalHeader>{overrideTarget ? "Confirm attendance change" : `Week ${sel?.week} · ${sel?.callup}`}</ModalHeader><ModalCloseButton isDisabled={act.busy} /><ModalBody pb={6}><Stack>
        {overrideTarget ? <>
          <Text>Change this member’s attendance to <b>{overrideTarget === "admin_marked_present" ? "Present" : "Absent"}</b>?</Text>
          <FormControl isRequired><FormLabel>Reason for this change</FormLabel><Textarea autoFocus value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Explain why this record is being changed" minLength={5} /><Text fontSize="xs" color="gray.600" mt={1}>{overrideReason.trim().length} characters · at least 5 are required.</Text></FormControl>
          <HStack justify="flex-end"><Button variant="outline" isDisabled={act.busy} onClick={() => setOverrideTarget(null)}>Back to review</Button><Button isLoading={act.busy} isDisabled={overrideReason.trim().length < 5} onClick={saveOverride}>Save attendance change</Button></HStack>
        </> : <>
        {imageLoading ? <Loading /> : img ? <Image src={img} maxW="260px" alt="Submitted" /> : <Text fontSize="sm" color="gray.600">{imageError || "No submitted photo is available for this record."}</Text>}
        <Text fontSize="sm"><b>Face check:</b> {sel?.face ? `${sel.face.result === "review" ? "Needs manual review" : sel.face.result === "passed" ? "Matched" : "Did not match"}. ${sel.face.reason}` : "No face submission"}</Text>
        <Text fontSize="sm"><b>Location check:</b> {sel?.location ? `${sel.location.result === "not_evaluated" ? "Not checked" : sel.location.result === "passed" ? "Inside camp area" : sel.location.result === "failed" ? "Outside camp area" : "Needs review"}. ${sel.location.reason}${sel.location.accuracy_m != null ? ` (GPS accuracy ±${Math.round(sel.location.accuracy_m)} m)` : ""}` : "No location submission"}</Text>
        <Text fontSize="sm"><b>Attendance decision:</b> {String(sel?.final_status ?? "").replace(/_/g, " ")} · {sel?.status_source === "automatic" ? "Automatic check" : sel?.status_source === "administrative_override" ? "Camp Director decision" : sel?.status_source}</Text>
        {sel?.overrides?.map((o: any, i: number) => <Text key={i} fontSize="xs">Override by {o.by} at {fmt(o.at)}: {o.from} → {o.to}. Reason: {o.reason}</Text>)}
        <HStack><Button onClick={() => over("admin_marked_present")}>Mark present (administrative)</Button><Button variant="outline" onClick={() => over("absent")}>Mark absent</Button></HStack>
        <Text fontSize="xs">Original face and location evidence is never overwritten by an override.</Text>
        </>}
      </Stack></ModalBody></ModalContent></Modal>
    </Page>
  );
}

export function ExitsAdmin() {
  const h = useStreams(); const act = useAction(); const [status, setStatus] = useState(""); const [page, setPage] = useState(1); const [tab, setTab] = useState("requests");
  const [reason, setReason] = useState(""); const [effective, setEffective] = useState(""); const [emergency, setEmergency] = useState(false); const [selected, setSelected] = useState<any>(null); const [extraTypes, setExtraTypes] = useState<string[]>([]); const [preview, setPreview] = useState<any>(null); const [returnNotice, setReturnNotice] = useState("");
  const { d, load, loading, error } = useData<any>(h.sid ? `/api/exits?stream_id=${h.sid}&page=${page}${status ? `&status=${status}` : ""}` : null);
  const detail = useData<any>(selected ? `/api/exits/${selected.id}` : null);
  const post = (id: string, p: string, json: any, ok: string) => act(() => api(`/api/exits/${id}/${p}`, { json }), ok, () => { load(); detail.load(); });
  const markReturned = (r: any) => act(async () => {
    const result = await api(`/api/exits/${r.id}/return`, { json: { note: "" } });
    setReturnNotice(result.bed_assigned ? "Return recorded. The member's bed is ready." : "Return recorded, but no bed is available. Assign a bed from Hostels & beds.");
    return result;
  }, "Member return recorded", () => { load(); detail.load(); });
  const decide = (r: any, approve: boolean) => post(r.id, "decide", { approve, reason, effective_date: effective ? new Date(effective).toISOString() : null, emergency }, approve ? "Exit approved" : "Exit declined");
  return <Page title="Exit requests" actions={<><Button variant="outline" onClick={() => act(() => download(`/api/reports/exits.csv?stream_id=${h.sid}`, "exits.csv"))}>CSV</Button><Button variant="outline" onClick={() => act(() => download(`/api/reports/exits.pdf?stream_id=${h.sid}`, "exits.pdf"))}>PDF</Button></>}>
    <Picker h={h} /><HStack><Button variant={tab === "requests" ? "solid" : "outline"} onClick={() => setTab("requests")}>Requests</Button><Button variant={tab === "categories" ? "solid" : "outline"} onClick={() => setTab("categories")}>Exit categories and evidence rules</Button></HStack>
    {tab === "categories" ? <ExitCategories streamId={h.sid} /> : <>
      <Select bg="white" maxW="260px" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All request stages</option>{["draft", "awaiting_platoon_confirmation", "awaiting_document_review", "awaiting_director_decision", "more_info_required", "approved", "rejected", "departed", "returned", "overdue", "completed", "cancelled"].map((s) => <option key={s}>{s}</option>)}</Select>
      {returnNotice && <Alert status="info"><AlertIcon />{returnNotice}</Alert>}
      {d ? <><DataTable rows={d.items} cols={[["Member", (r) => <>{r.full_name}<br />{r.callup}</>], ["Category", (r) => r.category_name], ["Duration", (r) => r.duration === "temporary" ? "Temporary · bed retained" : "Rest of camp"], ["Bed", (r) => r.returned_bed ? `Assigned on return · ${r.returned_bed}` : r.released_bed ? `Released · ${r.released_bed}` : r.duration === "temporary" && ["departed", "overdue"].includes(r.status) ? "Reserved" : "Assigned until departure"], ["Departure", (r) => fmt(r.depart_at)], ["Return due", (r) => fmt(r.return_at)], ["Officer", (r) => r.platoon_confirmation?.status || "Not required"], ["Status", (r) => <Status s={r.status} />], ["", (r) => <HStack><Button size="sm" onClick={() => { setSelected(r); setPreview(null); setReason(""); setEffective(""); setEmergency(false); setExtraTypes([]); }}>Review</Button>{["departed", "overdue"].includes(r.status) && <Button size="sm" colorScheme="green" isLoading={act.busy} onClick={() => markReturned(r)}>Mark returned</Button>}</HStack>]]} /><Pager page={page} total={d.total} size={50} set={setPage} /></> : loading ? <Loading /> : <ErrorBox msg={error || "Could not load exit requests."} />}
      {selected && <Card><Heading size="md">Review request · {detail.d?.full_name || selected.full_name}</Heading>{!detail.d ? <Loading /> : <Stack mt={3} spacing={3}>{detail.d.urgent && <Alert status="error"><AlertIcon />Urgent medical request · escalated to the Camp Director. Record only necessary information in your decision.</Alert>}<Text><b>{detail.d.callup}</b> · {detail.d.category_name} · {detail.d.duration}</Text><Text>Requested: {fmt(detail.d.depart_at)} · Return: {fmt(detail.d.return_at)}</Text><Text>Reason: {detail.d.reason}</Text><Text>Platoon confirmation: {detail.d.platoon_confirmation?.status || "not required"} {detail.d.platoon_confirmation?.notes ? `· ${detail.d.platoon_confirmation.notes}` : ""}</Text>
        <Heading size="sm">Evidence and document review</Heading>{(detail.d.requirements_snapshot?.document_types || []).filter((x: any) => x.active).map((type: any) => { const latest = [...(detail.d.documents || [])].reverse().find((x: any) => x.document_type_id === type.id); return <Text key={type.id} fontSize="sm">{type.name}: {latest ? latest.review_status.replace(/_/g, " ") : type.required ? "Missing · required" : "Not uploaded · optional"}</Text>; })}{(detail.d.documents || []).map((doc: any) => <Card key={doc.id} p={3}><HStack justify="space-between"><Box><Text fontWeight="600">{doc.document_type_name}</Text><Text fontSize="sm">{doc.filename} · {doc.review_status}{doc.review_notes ? ` · ${doc.review_notes}` : ""}</Text></Box><HStack><Button size="sm" variant="outline" onClick={async () => { if (preview?.url) URL.revokeObjectURL(preview.url); const url = await imageUrl(`/api/exits/${detail.d.id}/documents/${doc.id}/file`); setPreview({ url, mime: doc.mime_type, name: doc.filename }); }}>View securely</Button>{["awaiting_document_review", "more_info_required", "awaiting_director_decision"].includes(detail.d.status) && <><Button size="sm" onClick={() => post(detail.d.id, `documents/${doc.id}/review`, { decision: "accepted", notes: "Evidence accepted" }, "Evidence accepted")}>Accept</Button><Button size="sm" colorScheme="red" variant="outline" isDisabled={reason.trim().length < 5} onClick={() => post(detail.d.id, `documents/${doc.id}/review`, { decision: "rejected", notes: reason }, "Evidence declined")}>Reject with note</Button><Button size="sm" colorScheme="orange" variant="outline" isDisabled={reason.trim().length < 5} onClick={() => post(detail.d.id, `documents/${doc.id}/review`, { decision: "replacement_required", notes: reason }, "Replacement requested")}>Request replacement</Button></>}</HStack></HStack></Card>)}{!detail.d.documents?.length && <Text>No evidence has been uploaded.</Text>}{preview && <Card><HStack justify="space-between"><Text fontWeight="600">Private preview: {preview.name}</Text><Button size="sm" variant="ghost" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}>Close preview</Button></HStack>{preview.mime === "application/pdf" ? <Box as="iframe" title="Private evidence preview" src={preview.url} w="100%" h="600px" mt={2} /> : <Image src={preview.url} alt="Private evidence" maxH="600px" mt={2} />}</Card>}
        {detail.d.status !== "approved" && !["rejected", "cancelled", "departed", "returned", "completed"].includes(detail.d.status) && <><FormControl><FormLabel>Decision or request note</FormLabel><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain the decision or information needed" /></FormControl>{detail.d.duration === "remaining_period" && <FormControl><FormLabel>Effective bed-release date and time (if required by camp policy)</FormLabel><Input type="datetime-local" value={effective} onChange={(e) => setEffective(e.target.value)} /></FormControl>}{detail.d.urgent && <Checkbox isChecked={emergency} onChange={(e) => setEmergency(e.target.checked)}>Use the authorized urgent medical exception. Record only details needed in the decision reason.</Checkbox>}
          {!detail.d.urgent && <Box><Text fontWeight="600" mb={1}>Request additional evidence (optional)</Text><SimpleGrid columns={{ base: 1, md: 2 }}>{(detail.d.requirements_snapshot?.document_types || []).filter((x: any) => x.active).map((x: any) => <Checkbox key={x.id} isChecked={extraTypes.includes(x.id)} onChange={(e) => setExtraTypes(e.target.checked ? [...extraTypes, x.id] : extraTypes.filter((id) => id !== x.id))}>{x.name}</Checkbox>)}</SimpleGrid><Button mt={2} size="sm" variant="outline" isLoading={act.busy} isDisabled={reason.trim().length < 5 || !extraTypes.length} onClick={() => post(detail.d.id, "request-info", { document_type_ids: extraTypes, reason }, "More information requested")}>Request selected evidence</Button></Box>}
          <HStack wrap="wrap">{detail.d.status === "awaiting_director_decision" && <Button isLoading={act.busy} isDisabled={reason.trim().length < 5} onClick={() => decide(detail.d, true)}>Approve request</Button>}{["submitted", "awaiting_platoon_confirmation", "awaiting_document_review", "awaiting_director_decision", "more_info_required"].includes(detail.d.status) && <Button variant="outline" colorScheme="red" isLoading={act.busy} isDisabled={reason.trim().length < 5} onClick={() => decide(detail.d, false)}>Decline request</Button>}</HStack></>}
        {detail.d.status === "approved" && <Button isLoading={act.busy} onClick={() => post(detail.d.id, "depart", { note: reason }, "Departure recorded")}>Record actual departure</Button>}{["departed", "overdue"].includes(detail.d.status) && <Button colorScheme="green" isLoading={act.busy} onClick={() => markReturned(detail.d)}>Record member return</Button>}
        <Button variant="ghost" alignSelf="flex-start" onClick={() => setSelected(null)}>Close review</Button></Stack>}</Card>}
    </>}
  </Page>;
}

function ExitCategories({ streamId }: { streamId: string }) {
  const act = useAction(); const [rows, setRows] = useState<any[]>([]); const [editing, setEditing] = useState<any>(null); const [error, setError] = useState(""); const [documentError, setDocumentError] = useState("");
  const blank = () => ({ name: "", instructions: "", active: true, duration_options: ["temporary", "remaining_period"], emergency_medical: false, member_can_cancel: true, allow_concurrent_requests: false, require_platoon_confirmation: true, require_document_review: true, bed_release_rule: "after_effective_date", document_types: [], required_document_groups: [] });
  const [form, setForm] = useState<any>(blank()); const [doc, setDoc] = useState({ name: "", purpose: "", classification: "supporting_evidence", required: false, active: true, allowed_formats: ["pdf", "jpg", "png"], max_size_mb: 5 });
  const load = useCallback(() => { if (streamId) api<any[]>(`/api/exits/categories/admin?stream_id=${streamId}`).then(setRows).catch((e) => setError(e.message)); }, [streamId]);
  useEffect(() => { load(); }, [load]);
  const save = () => {
    const alternatives = form.document_types.filter((d: any) => d.alternative && d.active !== false).map((d: any) => d.id);
    const payload = { ...form, stream_id: streamId, document_types: form.document_types.map(({ alternative, ...d }: any) => d), required_document_groups: alternatives.length ? [alternatives] : [] };
    return act(() => api(editing ? `/api/exits/categories/${editing.id}` : "/api/exits/categories", { method: editing ? "PUT" : "POST", json: payload }), "Exit category saved", () => { setEditing(null); setForm(blank()); load(); });
  };
  const addDoc = () => {
    const name = doc.name.trim(); const purpose = doc.purpose.trim();
    if (name.length < 2 || purpose.length < 3) {
      setDocumentError("Enter a document type name (at least 2 characters) and what it establishes (at least 3 characters), then select Add document type.");
      return;
    }
    const id = globalThis.crypto?.randomUUID?.().replace(/-/g, "") || `${Date.now()}${Math.random().toString(16).slice(2)}`;
    setForm((current: any) => ({ ...current, document_types: [...current.document_types, { ...doc, name, purpose, id }] }));
    setDoc((current) => ({ ...current, name: "", purpose: "" }));
    setDocumentError("");
  };
  return <Stack spacing={4}>{error && <ErrorBox msg={error} />}<Card><Heading size="md" mb={3}>{editing ? "Edit exit category" : "Create an exit category"}</Heading><SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}><FormControl><FormLabel>Category name</FormLabel><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="For example: Medical exit" /></FormControl><FormControl><FormLabel>Bed rule for remaining-period exits</FormLabel><Select value={form.bed_release_rule} onChange={(e) => setForm({ ...form, bed_release_rule: e.target.value })}><option value="retain">Keep bed assigned</option><option value="after_approved_departure">Release after approved departure</option><option value="after_effective_date">Release when approved effective date is reached</option></Select></FormControl></SimpleGrid><FormControl mt={3}><FormLabel>Instructions for members</FormLabel><Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></FormControl><HStack wrap="wrap" mt={3}><Checkbox isChecked={form.duration_options.includes("temporary")} onChange={(e) => setForm({ ...form, duration_options: e.target.checked ? [...new Set([...form.duration_options, "temporary"])] : form.duration_options.filter((x: string) => x !== "temporary") })}>Allow temporary exit</Checkbox><Checkbox isChecked={form.duration_options.includes("remaining_period")} onChange={(e) => setForm({ ...form, duration_options: e.target.checked ? [...new Set([...form.duration_options, "remaining_period"])] : form.duration_options.filter((x: string) => x !== "remaining_period") })}>Allow rest-of-camp exit</Checkbox><Checkbox isChecked={form.require_platoon_confirmation} onChange={(e) => setForm({ ...form, require_platoon_confirmation: e.target.checked })}>Require Platoon Officer confirmation</Checkbox><Checkbox isChecked={form.require_document_review} onChange={(e) => setForm({ ...form, require_document_review: e.target.checked })}>Require document review</Checkbox><Checkbox isChecked={form.emergency_medical} onChange={(e) => setForm({ ...form, emergency_medical: e.target.checked })}>Allow urgent medical pathway</Checkbox><Checkbox isChecked={form.member_can_cancel} onChange={(e) => setForm({ ...form, member_can_cancel: e.target.checked })}>Allow members to cancel before approval</Checkbox></HStack>
    <Checkbox mt={2} isChecked={form.allow_concurrent_requests} onChange={(e) => setForm({ ...form, allow_concurrent_requests: e.target.checked })}>Allow more than one open request per member for this category</Checkbox>
    <Heading size="sm" mt={4}>Evidence accepted for this category</Heading>{form.document_types.map((d: any, i: number) => <HStack key={d.id} borderWidth="1px" p={2} justify="space-between" wrap="wrap"><Box><Text fontWeight="600">{d.name} · {d.classification.replace(/_/g, " ")}</Text><Text fontSize="sm">{d.purpose} · {d.allowed_formats.join(", ")} · up to {d.max_size_mb} MB</Text><HStack wrap="wrap"><Checkbox isChecked={d.active !== false} onChange={(e) => setForm({ ...form, document_types: form.document_types.map((x: any, n: number) => n === i ? { ...x, active: e.target.checked } : x) })}>Available for new requests</Checkbox><Checkbox isChecked={!!d.required} onChange={(e) => setForm({ ...form, document_types: form.document_types.map((x: any, n: number) => n === i ? { ...x, required: e.target.checked, alternative: e.target.checked ? false : x.alternative } : x) })}>Required every time</Checkbox><Checkbox isChecked={!!d.alternative} onChange={(e) => setForm({ ...form, document_types: form.document_types.map((x: any, n: number) => n === i ? { ...x, alternative: e.target.checked, required: false } : x) })}>Part of “submit any one” group</Checkbox></HStack></Box><Button size="xs" colorScheme="red" variant="ghost" onClick={() => setForm({ ...form, document_types: form.document_types.filter((_: any, n: number) => n !== i) })}>Remove</Button></HStack>)}
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={3}><FormControl isRequired><FormLabel>Document type name</FormLabel><Input value={doc.name} onChange={(e) => { setDoc({ ...doc, name: e.target.value }); setDocumentError(""); }} placeholder="For example: Clinic note" /><Text fontSize="xs" color="gray.600">At least 2 characters.</Text></FormControl><FormControl isRequired><FormLabel>What does it establish?</FormLabel><Input value={doc.purpose} onChange={(e) => { setDoc({ ...doc, purpose: e.target.value }); setDocumentError(""); }} placeholder="For example: Confirms a medical appointment" /><Text fontSize="xs" color="gray.600">At least 3 characters.</Text></FormControl><FormControl><FormLabel>Evidence purpose</FormLabel><Select value={doc.classification} onChange={(e) => setDoc({ ...doc, classification: e.target.value })}><option value="identity">Identity</option><option value="supporting_evidence">Supporting evidence</option><option value="reason_evidence">Evidence for reason for exit</option></Select></FormControl><FormControl><FormLabel>Maximum file size (MB)</FormLabel><Input type="number" min={1} max={20} value={doc.max_size_mb} onChange={(e) => setDoc({ ...doc, max_size_mb: Number(e.target.value) })} /></FormControl></SimpleGrid><HStack mt={2} wrap="wrap"><Checkbox isChecked={doc.required} onChange={(e) => setDoc({ ...doc, required: e.target.checked })}>Required for every request</Checkbox>{["pdf", "jpg", "png", "webp"].map((fmt) => <Checkbox key={fmt} isChecked={doc.allowed_formats.includes(fmt)} onChange={(e) => setDoc({ ...doc, allowed_formats: e.target.checked ? [...doc.allowed_formats, fmt] : doc.allowed_formats.filter((x: string) => x !== fmt) })}>{fmt.toUpperCase()}</Checkbox>)}<Button size="sm" variant="outline" onClick={addDoc}>Add document type</Button></HStack>{documentError && <Alert status="warning"><AlertIcon />{documentError}</Alert>}<Text fontSize="sm" color="gray.600">Choose evidence combinations according to camp policy. The evidence purpose is descriptive and does not decide the request automatically.</Text>
    <HStack mt={3}><Button isLoading={act.busy} isDisabled={form.name.trim().length < 2 || !form.duration_options.length} onClick={save}>Save category</Button><Button variant="outline" onClick={() => { setEditing(null); setForm(blank()); }}>Clear</Button></HStack></Card><Card><Heading size="md" mb={3}>Configured categories</Heading><DataTable rows={rows} cols={[["Category", (r) => r.name], ["Status", (r) => <Status s={r.active ? "active" : "closed"} />], ["Evidence types", (r) => r.document_types?.length || 0], ["Version", (r) => r.version], ["", (r) => <HStack><Button size="sm" onClick={() => { setEditing(r); const alternativeIds = r.required_document_groups?.flat() || []; setForm({ ...r, document_types: (r.document_types || []).map((x: any) => ({ ...x, alternative: alternativeIds.includes(x.id) })) }); }}>Edit</Button><Button size="sm" variant="outline" onClick={() => act(() => api(`/api/exits/categories/${r.id}`, { method: "PUT", json: { ...r, stream_id: streamId, active: !r.active } }), r.active ? "Category deactivated" : "Category activated", load)}>{r.active ? "Deactivate" : "Activate"}</Button></HStack>]]} /></Card></Stack>;
}

export function Engagement() {
  const h = useStreams(); const act = useAction(); const cs = useData<any[]>(h.sid ? `/api/complaints?stream_id=${h.sid}` : null);
  const [a, setA] = useState({ title: "", body: "" });
  const reply = (r: any, status: string) => { const response = prompt("Response to the corps member (optional):") ?? ""; act(() => api(`/api/complaints/${r.id}/respond`, { json: { status, response, resolution: status === "resolved" ? response : undefined } }), "Updated", cs.load); };
  const assign = (r: any) => { const who = prompt("Assign internally to (name/unit):", r.assigned_to ?? ""); if (who !== null) act(() => api(`/api/complaints/${r.id}/respond`, { json: { status: r.status, assigned_to: who } }), "Assigned", cs.load); };
  return (
    <Page title="Complaints and announcements">
      <Picker h={h} />
      <Card><Text fontWeight="600" mb={2}>Publish announcement to this stream</Text><Stack><Input placeholder="Title" value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} /><Textarea placeholder="Message" value={a.body} onChange={(e) => setA({ ...a, body: e.target.value })} />
        <Button alignSelf="flex-start" isLoading={act.busy} onClick={() => act(() => api("/api/announcements", { json: { ...a, stream_id: h.sid } }), "Published", () => setA({ title: "", body: "" }))}>Publish</Button></Stack></Card>
      {cs.d ? <DataTable rows={cs.d} empty="No complaints or suggestions." cols={[["From", (r) => (r.anonymous ? "Anonymous" : r.callup)], ["Type", (r) => r.kind], ["Category", (r) => r.category], ["Subject", (r) => <Box maxW="320px"><b>{r.subject}</b><Text fontSize="xs" whiteSpace="pre-wrap">{r.body}</Text></Box>], ["Status", (r) => <Status s={r.status} />], ["Assigned to", (r) => r.assigned_to ?? "-"], ["Filed", (r) => fmt(r.created_at)],
        ["", (r) => <HStack><Button size="xs" variant="ghost" onClick={() => assign(r)}>Assign</Button><Button size="xs" variant="outline" onClick={() => reply(r, "in_review")}>In review</Button><Button size="xs" onClick={() => reply(r, "resolved")}>Resolve</Button></HStack>]]} />
        : cs.loading ? <Loading /> : <ErrorBox msg={cs.error || "Could not load complaints."} />}
    </Page>
  );
}

export function Reports() {
  const h = useStreams(); const act = useAction(); const [cfg, setCfg] = useState<any>(null);
  const [cfgError, setCfgError] = useState(""); const [locationError, setLocationError] = useState(""); const [locating, setLocating] = useState(false);
  useEffect(() => { api("/api/config/camp").then(setCfg).catch(() => setCfgError("Could not load attendance location settings. Refresh the page and try again.")); }, []);
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationError("This device cannot provide a location. Enter the camp coordinates below."); return; }
    setLocationError(""); setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setCfg((c: any) => ({ ...c, lat: Number(p.coords.latitude.toFixed(6)), lon: Number(p.coords.longitude.toFixed(6)) })); setLocating(false); },
      () => { setLocationError("Could not get this device's location. Allow location access in the browser or enter the coordinates below."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };
  const locationSettingsValid = cfg && Number.isFinite(Number(cfg.lat)) && Number(cfg.lat) >= -90 && Number(cfg.lat) <= 90 &&
    Number.isFinite(Number(cfg.lon)) && Number(cfg.lon) >= -180 && Number(cfg.lon) <= 180 &&
    Number(cfg.radius_m) > 0 && Number(cfg.radius_m) <= 20000 && Number(cfg.max_accuracy_m) > 0 && Number(cfg.max_accuracy_m) <= 2000;
  const kinds: [string, string][] = [["members", "Registration list"], ["occupancy", "Hostel occupancy"], ["attendance", "Weekly attendance sheet"], ["exceptions", "Attendance exceptions"], ["overrides", "Manual overrides"], ["exits", "Exits and overdue returns"]];
  return (
    <Page title="Reports and settings">
      <Picker h={h} />
      <Card><Heading size="sm" mb={1}>Attendance location area</Heading>
        <Text fontSize="sm" mb={3}>Choose the camp centre and how far from it members can be for attendance. The phone location is checked once when a member submits attendance.</Text>
        {cfgError && <Alert status="error" mb={3}><AlertIcon />{cfgError}</Alert>}
        {!cfg && !cfgError && <Loading />}
        {cfg && <Stack spacing={3}>
          <Button alignSelf="flex-start" variant="outline" isLoading={locating} onClick={useCurrentLocation}>Use this device as camp centre</Button>
          {locationError && <Alert status="warning"><AlertIcon />{locationError}</Alert>}
          <Text fontSize="sm" color={cfg.lat === 0 && cfg.lon === 0 ? "orange.700" : "gray.600"}>{cfg.lat === 0 && cfg.lon === 0 ? "Camp centre is not set yet. Set it while at camp before opening attendance." : `Camp centre: ${cfg.lat}, ${cfg.lon}`}</Text>
          <HStack wrap="wrap" align="flex-end">
            {([["lat", "Latitude"], ["lon", "Longitude"], ["radius_m", "Allowed distance (metres)"], ["max_accuracy_m", "GPS accuracy limit (metres)"]] as const).map(([k, l]) => <FormControl key={k} maxW="220px"><FormLabel>{l}</FormLabel><Input type="number" step="any" value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value === "" ? "" : +e.target.value })} /></FormControl>)}
            <Button isLoading={act.busy} isDisabled={!locationSettingsValid} onClick={() => act(() => api("/api/config/camp", { method: "PUT", json: cfg }), "Attendance location settings saved")}>Save location area</Button>
          </HStack>
          <Text fontSize="xs" color="gray.600">The allowed distance is measured from the camp centre. A smaller GPS accuracy number requires a more precise phone reading.</Text>
        </Stack>}
      </Card>
      <DataTable rows={kinds.map(([k, l]) => ({ k, l }))} cols={[["Report", (r) => r.l], ["", (r) => <HStack><Button size="xs" variant="outline" onClick={() => act(() => download(`/api/reports/${r.k}.csv?stream_id=${h.sid}`, `${r.k}.csv`))}>CSV</Button><Button size="xs" onClick={() => act(() => download(`/api/reports/${r.k}.pdf?stream_id=${h.sid}`, `${r.k}.pdf`))}>PDF</Button></HStack>]]} />
      <Button alignSelf="flex-start" variant="outline" onClick={() => act(() => download("/api/reports/audit-log.csv", "audit-log.csv"))}>Download audit log (CSV)</Button>
    </Page>
  );
}
