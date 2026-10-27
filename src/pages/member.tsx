import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertIcon, Box, Button, FormControl, FormLabel, HStack, Input, Radio, RadioGroup, Select, SimpleGrid, Stack, Text, Textarea, Checkbox, Heading, Divider } from "@chakra-ui/react";
import { api, download } from "../api";
import { useAuth } from "../auth";
import { Page } from "../components/Layout";
import { Camera } from "../components/Camera";
import { BedPass, Card, DataTable, Empty, ErrorBox, Loading, Stat, Status, useAction } from "../components/ui";
import { Icon } from "../components/Icon";
import { C } from "../theme";
import { enablePush, pushSupported } from "../push";
import { missingExitEvidence, validateExitDraft } from "./exitValidation";

function useLoad<T>(path: string) {
  const [d, setD] = useState<T | null>(null); const [err, setErr] = useState(""); const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true); setErr("");
    return api<T>(path).then((value) => setD(value)).catch((e) => { setD(null); setErr(e.message || "Could not load this information."); }).finally(() => setLoading(false));
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { d, err, load, loading };
}
const fmt = (s?: string) => (s ? new Date(s).toLocaleString() : "-");

function additionalEvidenceStatus(request: any, requirement: any) {
  const requestedAt = requirement.requested_at ? Date.parse(requirement.requested_at) : Number.NEGATIVE_INFINITY;
  const latestByType = new Map<string, any>();
  for (const doc of request.documents || []) {
    if (!requirement.document_type_ids?.includes(doc.document_type_id)) continue;
    const uploadedAt = Date.parse(doc.uploaded_at);
    if (Number.isFinite(requestedAt) && (!Number.isFinite(uploadedAt) || uploadedAt <= requestedAt)) continue;
    const previous = latestByType.get(doc.document_type_id);
    if (!previous || uploadedAt >= Date.parse(previous.uploaded_at)) latestByType.set(doc.document_type_id, doc);
  }
  const documents = [...latestByType.values()];
  if (documents.some((doc) => doc.review_status === "accepted")) return null;
  if (documents.some((doc) => doc.review_status === "pending_review")) {
    return { status: "info" as const, message: `Evidence sent: ${requirement.reason}. It is waiting for the Camp Director to review it.` };
  }
  if (documents.some((doc) => ["rejected", "replacement_required"].includes(doc.review_status))) {
    return { status: "warning" as const, message: `Evidence still needed: ${requirement.reason}. Please upload an updated document.` };
  }
  return { status: "warning" as const, message: `Evidence still needed: ${requirement.reason}. Upload one of the requested document types above.` };
}

export function Home() {
  const { me } = useAuth(); const p = me!.profile;
  const { d: ann, err: annErr, loading: annLoading, load } = useLoad<any[]>("/api/announcements"); const { d: as, loading: asLoading } = useLoad<any>("/api/assignments/me"); const { d: cur, loading: curLoading } = useLoad<any>("/api/attendance/current");
  const { d: platoon, loading: platoonLoading } = useLoad<any>("/api/platoons/me");
  const act = useAction();
  return (
    <Page title={`Welcome, ${p.full_name.split(" ")[0]}`} sub={`${p.callup} · ${p.stream_label}`}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        <Stat label="Registration" value={<Status s={p.registration_status} />} note={`Face enrolment: ${p.biometric_status.replace(/_/g, " ")}`} color={C.khaki} />
        <Stat label="Weekly attendance" value={curLoading ? "Loading…" : !cur ? "Unavailable" : !cur.open ? "Closed" : cur.submission ? "Submitted" : "Open now"} note={cur?.open && !cur.submission ? "Tap Attendance to check in" : cur?.submission ? cur.submission.final_status.replace(/_/g, " ") : undefined} color={cur?.open && !cur.submission ? C.amber : C.green} />
        <Stat label="My bed" value={asLoading ? "Loading…" : as?.assignment ? as.assignment.bed_code : "Not yet assigned"} note={as?.assignment ? `${as.assignment.position} bunk` : "You will be notified"} />
        <Stat label="My platoon" value={platoonLoading ? "Loading…" : platoon?.platoon ? `Platoon ${platoon.platoon.number}` : "Awaiting assignment"} note={platoon?.platoon?.officer_name ? `Officer: ${platoon.platoon.officer_name}` : platoon?.reason || "The Camp Director will be notified if action is needed"} />
      </SimpleGrid>
      {as?.assignment && <BedPass name={as.member.full_name} callup={as.member.callup} stream={as.member.stream} hostel={as.assignment.hostel_code} bunk={as.assignment.bunk} position={as.assignment.position} assigned={fmt(as.assignment.assigned_at)} />}
      <Heading size="lg">Announcements</Heading>
      {!ann ? (annLoading ? <Loading /> : <ErrorBox msg={annErr || "Could not load announcements."} />) : !ann.length ? <Empty>No announcements yet.</Empty> : ann.map((a) => (
        <Card key={a.id} borderLeft={`5px solid ${a.read ? C.line : C.khaki}`} cursor="pointer" onClick={() => !a.read && act(() => api(`/api/announcements/${a.id}/read`, { method: "POST" }), "Marked as read", load)}>
          <Text fontFamily="heading" fontSize="xl" fontWeight={700}>{a.title}</Text><Text fontSize="xs" color="gray.500">{fmt(a.created_at)}</Text><Text mt={1} whiteSpace="pre-wrap">{a.body}</Text></Card>))}
    </Page>
  );
}

export function MyPlatoon() {
  const { d: profile, err, loading, load } = useLoad<any>("/api/members/me");
  const { d: assignment, load: loadAssignment } = useLoad<any>("/api/platoons/me");
  const [code, setCode] = useState(""); const act = useAction();
  useEffect(() => { if (profile?.state_code) setCode(profile.state_code); }, [profile?.state_code]);
  if (loading || !assignment) return <Loading />;
  if (err) return <ErrorBox msg={err} />;
  const active = assignment.status === "confirmed" && assignment.platoon;
  return <Page title="My platoon" sub="Your assignment is based on the state code in your NYSC documents.">
    {active ? <Card><Heading size="lg">Platoon {assignment.platoon.number}</Heading><Text mt={2}>Your platoon assignment is confirmed.</Text>{assignment.platoon.officer_name && <Text mt={1}>Platoon Officer: {assignment.platoon.officer_name}</Text>}</Card>
      : <Card><Heading size="md" mb={2}>Add your state code</Heading><Text mb={3}>If you did not have your NYSC state code when you registered, add it here when you receive your documents. We will assign your platoon automatically when the camp mapping is available.</Text>
        {assignment.reason && <Alert status="info" mb={3}><AlertIcon />{assignment.reason}</Alert>}
        <FormControl isRequired maxW="360px"><FormLabel>NYSC state code</FormLabel><Input inputMode="numeric" pattern="[0-9]{1,6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter the numeric code" /><Text fontSize="xs" color="gray.600" mt={1}>Enter the numeric code exactly as shown on your NYSC documents.</Text></FormControl>
        <Button mt={3} isLoading={act.busy} isDisabled={!/^\d{1,6}$/.test(code)} onClick={() => act(() => api("/api/members/me/state-code", { method: "PUT", json: { state_code: code } }), "State code saved", () => { load(); loadAssignment(); })}>{profile?.state_code ? "Save state code" : "Save and get my platoon"}</Button>
      </Card>}
  </Page>;
}

export function Assignment() {
  const { d, err } = useLoad<any>("/api/assignments/me"); const act = useAction();
  if (err) return <ErrorBox msg={err} />; if (!d) return <Loading />;
  const a = d.assignment;
  return (
    <Page title="My hostel assignment" actions={a && <><Button variant="outline" leftIcon={<Icon n="print" size={16} />} onClick={() => window.print()}>Print</Button><Button onClick={() => act(() => download("/api/reports/my-assignment.pdf", "assignment.pdf"))}>Download PDF</Button></>}>
      {!a ? <Empty>You have not been assigned a bed yet. You will get a notification when the Camp Director allocates one.</Empty>
        : <BedPass name={d.member.full_name} callup={d.member.callup} stream={d.member.stream} hostel={a.hostel_code} bunk={a.bunk} position={a.position} assigned={fmt(a.assigned_at)} />}
    </Page>
  );
}

export function Swaps() {
  const { d, err, loading, load } = useLoad<any[]>("/api/swaps/mine"); const { me } = useAuth(); const act = useAction();
  const [friend, setFriend] = useState("");
  const mine = me!.profile.callup;
  return (
    <Page title="Bunk swap">
      <Card><Text mb={2}>Enter your friend's call-up number. Both of you must agree before beds change.</Text>
        <HStack><Input placeholder="Friend's call-up number" value={friend} onChange={(e) => setFriend(e.target.value)} />
          <Button isLoading={act.busy} onClick={() => act(() => api("/api/swaps", { json: { friend_callup: friend } }), "Request sent", () => { setFriend(""); load(); })}>Send request</Button></HStack></Card>
      {!d ? (loading ? <Loading /> : <ErrorBox msg={err || "Could not load swap requests."} />) : <DataTable empty="No swap requests." rows={d} cols={[["With", (r) => (r.from_callup === mine ? r.to_callup : r.from_callup)], ["Your bed → their bed", (r) => (r.from_callup === mine ? `${r.from_bed} ⇄ ${r.to_bed}` : `${r.to_bed} ⇄ ${r.from_bed}`)], ["Status", (r) => <Status s={r.status} />],
        ["", (r) => r.status === "pending" && (r.to_callup === mine
          ? <HStack><Button size="xs" onClick={() => act(() => api(`/api/swaps/${r.id}/respond`, { json: { accept: true } }), "Swap completed", load)}>Accept swap</Button><Button size="xs" variant="outline" onClick={() => act(() => api(`/api/swaps/${r.id}/respond`, { json: { accept: false } }), "Declined", load)}>Decline</Button></HStack>
          : <Button size="xs" variant="outline" onClick={() => act(() => api(`/api/swaps/${r.id}/cancel`, { method: "POST" }), "Cancelled", load)}>Cancel</Button>)]]} />}
    </Page>
  );
}

export function Exits() {
  const { d: rows, err, loading, load } = useLoad<any[]>("/api/exits/mine"); const { d: categories, err: categoryError } = useLoad<any[]>("/api/exits/categories?stream_id=" + (useAuth().me?.profile?.stream_id || "")); const act = useAction();
  const [f, setF] = useState({ category_id: "", duration: "", reason: "", depart_at: "", return_at: "", urgent: false });
  const [selected, setSelected] = useState<any>(null); const [uploading, setUploading] = useState(""); const [uploadError, setUploadError] = useState("");
  const activeRequest = rows?.find((r) => ["draft", "submitted", "awaiting_platoon_confirmation", "awaiting_document_review", "awaiting_director_decision", "more_info_required", "approved", "departing", "departed", "overdue"].includes(r.status));
  const category = categories?.find((c) => c.id === (selected?.category_id || f.category_id));
  const draftErrors = validateExitDraft({ category: categories?.find((c) => c.id === f.category_id), ...f });
  const departureError = draftErrors.find((message) => message.includes("departure"));
  const returnError = draftErrors.find((message) => message.includes("return time"));
  const reasonError = draftErrors.find((message) => message.includes("reason"));
  const minDeparture = new Date(Date.now() + 60_000);
  minDeparture.setSeconds(0, 0);
  const minDepartureValue = new Date(minDeparture.getTime() - minDeparture.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  const iso = (v: string) => v ? new Date(v).toISOString() : null;
  const create = async () => {
    const result = await api<any>("/api/exits", { json: { ...f, depart_at: iso(f.depart_at), return_at: f.duration === "temporary" ? iso(f.return_at) : null } });
    setUploadError(""); setSelected(result); await load();
  };
  const upload = async (requestId: string, typeId: string, file: File) => {
    setUploading(typeId); setUploadError("");
    try { const body = new FormData(); body.append("document_type_id", typeId); body.append("file", file); const saved = await api<any>(`/api/exits/${requestId}/documents`, { form: body }); setSelected((prev: any) => prev?.id === requestId ? { ...prev, documents: [...(prev.documents || []), { id: saved.id, document_type_id: typeId, document_type_name: saved.document_type, review_status: saved.review_status }] } : prev); await load(); }
    catch (e: any) { setUploadError(e.message || "The file could not be uploaded. Check its format and size, then try again."); }
    finally { setUploading(""); }
  };
  const documents = (r: any) => {
    const c = categories?.find((x) => x.id === r.category_id); const req = r.requirements_snapshot || c || {};
    return <Stack spacing={2}>{(req.document_types || []).filter((dt: any) => dt.active !== false).map((dt: any) => {
      const doc = [...(r.documents || [])].reverse().find((x: any) => x.document_type_id === dt.id);
      return <Card key={dt.id} p={3}><HStack justify="space-between" align="flex-start"><Box><Text fontWeight="600">{dt.name}{dt.required ? " · Required" : " · Optional"}</Text><Text fontSize="sm" color="gray.600">{dt.purpose}</Text><Text fontSize="sm" mt={1}>Status: {doc ? String(doc.review_status).replace(/_/g, " ") + (doc.review_notes ? ` · ${doc.review_notes}` : "") : dt.required ? "Missing" : "Not uploaded"}</Text></Box>
        {["draft", "awaiting_document_review", "more_info_required"].includes(r.status) && <Input type="file" accept={(dt.allowed_formats || []).map((x: string) => `.${x}`).join(",")} maxW="260px" p={1} aria-label={`Upload ${dt.name}`} isDisabled={uploading === dt.id} onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(r.id, dt.id, file); e.currentTarget.value = ""; }} />}</HStack>{uploading === dt.id && <Text fontSize="sm">Uploading securely…</Text>}</Card>;
    })}{(req.required_document_groups || []).map((group: string[], i: number) => <Text key={i} fontSize="sm">Alternative {i + 1}: submit one accepted document from the available types above.</Text>)}{(req.additional_requirements || []).map((x: any, i: number) => { const state = additionalEvidenceStatus(r, x); return state ? <Alert key={i} status={state.status}><AlertIcon />{state.message}</Alert> : null; })}</Stack>;
  };
  const openStatuses = ["draft", "submitted", "awaiting_platoon_confirmation", "awaiting_document_review", "awaiting_director_decision", "more_info_required"];
  return <Page title="Exit requests" sub="Choose the reason for leaving camp and follow each step shown below.">
    {activeRequest ? <Alert status="info"><AlertIcon />You already have an open exit request. Continue or check its status below before starting another request.</Alert> : !rows ? <Loading /> : categoryError ? <Alert status="warning"><AlertIcon />{categoryError}</Alert> : !categories ? <Loading /> : <Card><Stack spacing={3}><Heading size="md">Start a request</Heading>
      <FormControl isRequired><FormLabel>Exit category</FormLabel><Select bg="white" value={f.category_id} onChange={(e) => { const c = categories.find((x) => x.id === e.target.value); setF({ ...f, category_id: e.target.value, duration: c?.duration_options?.[0] || "" }); }}><option value="">Choose a category</option>{categories.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</Select></FormControl>
      {category && <><Text fontSize="sm" color="gray.600">{category.instructions || "Follow the evidence and approval steps shown after you create your request."}</Text>
        <Card p={3}><Text fontWeight="600">Evidence for this category</Text>{category.document_types?.filter((x: any) => x.active).map((x: any) => <Text key={x.id} fontSize="sm">{x.name} · {x.required ? "Required" : "Optional"} — {x.purpose}</Text>)}{category.required_document_groups?.length > 0 && <Text fontSize="sm" mt={1}>Some evidence may be accepted as alternatives. The request will show which document group applies.</Text>}</Card>
        <FormControl isRequired><FormLabel>How long will you be away?</FormLabel><Select bg="white" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })}>{category.duration_options?.map((x: string) => <option key={x} value={x}>{x === "temporary" ? "Temporary — I expect to return" : "For the rest of the camp period"}</option>)}</Select></FormControl>
        {f.duration === "temporary" ? <Alert status="info"><AlertIcon />A temporary exit keeps your assigned bed reserved while you are away.</Alert> : <Alert status="warning"><AlertIcon />Your bed stays assigned until the Camp Director approves the request and the camp's bed-release condition is met.</Alert>}
        <FormControl isRequired isInvalid={!!departureError}><FormLabel>Departure date and time</FormLabel><Input type="datetime-local" min={f.urgent && category?.emergency_medical ? undefined : minDepartureValue} value={f.depart_at} onChange={(e) => setF({ ...f, depart_at: e.target.value })} />{departureError && <Text role="alert" color="red.600" fontSize="sm" mt={1}>{departureError}</Text>}</FormControl>
        {f.duration === "temporary" && <FormControl isRequired isInvalid={!!returnError}><FormLabel>Expected return date and time</FormLabel><Input type="datetime-local" min={f.depart_at || minDepartureValue} value={f.return_at} onChange={(e) => setF({ ...f, return_at: e.target.value })} />{returnError && <Text role="alert" color="red.600" fontSize="sm" mt={1}>{returnError}</Text>}</FormControl>}
        <FormControl isRequired isInvalid={!!reasonError}><FormLabel>Reason for request</FormLabel><Textarea value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />{reasonError && <Text role="alert" color="red.600" fontSize="sm" mt={1}>{reasonError}</Text>}</FormControl>
        {category.emergency_medical && <Checkbox isChecked={f.urgent} onChange={(e) => setF({ ...f, urgent: e.target.checked })}>This is an urgent medical emergency requiring immediate Camp Director attention</Checkbox>}
        {draftErrors.length > 0 && <Alert status="info"><AlertIcon /><Box>{draftErrors.join(" ")}</Box></Alert>}
        <Button isLoading={act.busy} isDisabled={draftErrors.length > 0} onClick={() => act(create, "Draft created", () => {})}>Continue to evidence</Button>
      </>}
    </Stack></Card>}
    {selected && <Card><Heading size="md" mb={2}>Complete your request</Heading><Text mb={3}>Your request is a draft and has not been sent yet. Upload the required evidence, then submit it for review.</Text><ErrorBox msg={uploadError} />{documents(selected)}{missingExitEvidence(selected, category).length > 0 && <Alert mt={3} status={selected.urgent && category?.emergency_medical ? "warning" : "info"}><AlertIcon /><Box>{selected.urgent && category?.emergency_medical ? "You can send this urgent medical request now. The Camp Director will see the evidence still outstanding." : `Before submitting, upload: ${missingExitEvidence(selected, category).join("; ")}`}</Box></Alert>}<Button mt={3} isLoading={act.busy} isDisabled={missingExitEvidence(selected, category).length > 0 && !(selected.urgent && category?.emergency_medical)} onClick={() => act(() => api(`/api/exits/${selected.id}/submit`, { method: "POST" }), "Request submitted", () => { setSelected(null); load(); })}>Submit request</Button></Card>}
    {!rows ? (loading ? <Loading /> : <ErrorBox msg={err || "Could not load exit requests."} />) : rows.map((r) => <Card key={r.id}><HStack justify="space-between"><Heading size="sm">{r.category_name} · {r.duration === "temporary" ? "Temporary" : "Rest of camp"}</Heading><Status s={r.status} /></HStack><Text fontSize="sm" mt={2}>Requested departure: {fmt(r.depart_at)}{r.return_at ? ` · Expected return: ${fmt(r.return_at)}` : ""}</Text><Text mt={2}>{r.reason}</Text>{r.decision_note && <Alert mt={3} status={r.status === "rejected" ? "error" : "info"}><AlertIcon />Camp Director: {r.decision_note}</Alert>}{r.platoon_confirmation?.notes && <Text mt={2} fontSize="sm">Officer note: {r.platoon_confirmation.notes}</Text>}
      {documents(r)}{openStatuses.includes(r.status) && <HStack mt={3}>{r.status !== "draft" && <Button size="sm" isLoading={act.busy} onClick={() => act(() => api(`/api/exits/${r.id}/submit`, { method: "POST" }), "Request updated", load)}>Submit updates</Button>}<Button size="sm" variant="outline" onClick={() => act(() => api(`/api/exits/${r.id}/cancel`, { method: "POST" }), "Request cancelled", load)}>Cancel request</Button></HStack>}
    </Card>)}
  </Page>;
}

export function Attendance() {
  const { d, err: currentErr, loading: currentLoading, load } = useLoad<any>("/api/attendance/current"); const { d: hist, err: histErr, loading: histLoading, load: loadHist } = useLoad<any[]>("/api/attendance/mine");
  const [photo, setPhoto] = useState<Blob | null>(null); const [turned, setTurned] = useState<Blob | null>(null); const [res, setRes] = useState<any>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [geo, setGeo] = useState<GeolocationCoordinates | null>(null); const [geoErr, setGeoErr] = useState(""); const [geoLoading, setGeoLoading] = useState(false); const [ch, setCh] = useState<any>(null); const [challengeLoading, setChallengeLoading] = useState(false); const [challengeErr, setChallengeErr] = useState("");
  const loadChallenge = () => { setChallengeLoading(true); setChallengeErr(""); api("/api/attendance/challenge").then(setCh).catch((e: any) => setChallengeErr(e.message || "Could not prepare the face check. Please try again.")).finally(() => setChallengeLoading(false)); };
  useEffect(() => { if (d?.open && !d.submission) loadChallenge(); }, [d?.open, d?.submission]);
  const askLocation = () => {
    setGeoErr("");
    if (!navigator.geolocation) { setGeoErr("This device cannot provide a location. Use a device with location services enabled."); return; }
    setGeoLoading(true); navigator.geolocation.getCurrentPosition((p) => { setGeo(p.coords); setGeoLoading(false); }, () => { setGeoErr("Location blocked. Allow location access for this site in your browser settings."); setGeoLoading(false); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  };
  const needTurn = ch?.required;
  const submit = async () => {
    setBusy(true); setErr("");
    const fd = new FormData(); fd.append("schedule_id", d.schedule.id); fd.append("selfie", photo!, "selfie.jpg");
    if (needTurn) { fd.append("challenge_selfie", turned!, "turn.jpg"); fd.append("challenge_token", ch.token); }
    if (geo) { fd.append("lat", String(geo.latitude)); fd.append("lon", String(geo.longitude)); fd.append("accuracy", String(geo.accuracy)); }
    try { setRes(await api("/api/attendance/submit", { form: fd })); load(); loadHist(); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  if (!d) return currentLoading ? <Loading /> : <ErrorBox msg={currentErr || "Could not load the attendance window."} />;
  const ready = !!photo && (!needTurn || !!turned) && !!geo;
  return (
    <Page title="Weekly attendance">
      {!d.open ? <Empty>Attendance is not open right now. You will get a notification when it opens.</Empty>
        : d.submission && !res ? <Stat label={d.schedule.label} value="Submitted" note={<Status s={d.submission.final_status} />} />
        : res ? <Stat label="Result" value={res.status === "verified_present" ? "Verified present" : res.status.replace(/_/g, " ")} note={res.message} color={res.status === "verified_present" ? C.green : C.amber} />
        : challengeLoading ? <Loading /> : challengeErr ? <Stack><ErrorBox msg={challengeErr} /><Button alignSelf="flex-start" onClick={loadChallenge}>Try again</Button></Stack> : <Stack spacing={4}>
          <Card><Text fontFamily="heading" fontSize="2xl" fontWeight={700}>{d.schedule.label}</Text><Text fontSize="sm">Closes {fmt(d.schedule.closes_at)}</Text>
            <Text fontSize="sm" mt={2}>Your face is checked first. Only if that passes is your location checked against the camp area. Location is read once, now, never tracked. If a check is unclear, the Camp Director reviews it; it is never treated as misconduct automatically.</Text></Card>
          <Card><Text fontWeight={700} mb={2}>1. Location</Text><HStack><Button variant="outline" isLoading={geoLoading} onClick={askLocation}>{geo ? "Refresh location" : "Allow location"}</Button><Text fontSize="sm">{geo ? `Captured (±${Math.round(geo.accuracy)} m)` : geoErr || "Required"}</Text></HStack></Card>
          <Card><Camera label={needTurn ? "2. Photo 1: face the camera" : "2. Live photo"} hint="Face the light, no cap or sunglasses, look straight at the camera." onCapture={setPhoto} /></Card>
          {needTurn && <Card>{photo ? <Camera label="3. Photo 2: turn your head to one side" hint="Keep your face in view, turned about 30 degrees to either side." onCapture={setTurned} /> : <Text fontSize="sm" color="gray.600">Photo 2 opens after photo 1. {ch.instruction}</Text>}</Card>}
          <ErrorBox msg={err} />
          <Button size="lg" isDisabled={!ready} isLoading={busy} onClick={submit}>Submit attendance</Button>
        </Stack>}
      <Heading size="lg">My attendance history</Heading>
      {!hist ? (histLoading ? <Loading /> : <ErrorBox msg={histErr || "Could not load attendance history."} />) : <DataTable empty="No attendance records yet." rows={hist} cols={[["Week", (r) => r.week], ["Status", (r) => <Status s={r.status} />], ["Decided by", (r) => (r.source === "administrative_override" ? "Camp Director" : r.source === "policy" ? "Attendance policy" : "Automatic check")], ["Submitted", (r) => fmt(r.submitted_at)]]} />}
    </Page>
  );
}

export function Complaints() {
  const { d, err, loading, load } = useLoad<any[]>("/api/complaints/mine"); const act = useAction();
  const [f, setF] = useState<any>({ kind: "complaint", category: "accommodation", subject: "", body: "", private: true, anonymous: false });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  return (
    <Page title="Complaints and suggestions">
      <Card><Stack spacing={3}>
        <HStack><Select value={f.kind} onChange={set("kind")}><option value="complaint">Complaint</option><option value="suggestion">Suggestion</option></Select>
          <Select value={f.category} onChange={set("category")}>{["accommodation", "feeding", "sanitation", "welfare", "security", "general"].map((c) => <option key={c}>{c}</option>)}</Select></HStack>
        <Input placeholder="Subject" value={f.subject} onChange={set("subject")} /><Textarea placeholder="Describe the issue or idea" value={f.body} onChange={set("body")} />
        <Checkbox isChecked={f.private} onChange={(e) => setF({ ...f, private: e.target.checked })}>Keep private (only the Camp Director sees it)</Checkbox>
        {f.kind === "suggestion" && <Checkbox isChecked={f.anonymous} onChange={(e) => setF({ ...f, anonymous: e.target.checked })}>Send anonymously (you will not be able to track it)</Checkbox>}
        <Button isLoading={act.busy} onClick={() => act(() => api("/api/complaints", { json: f }), "Submitted", () => { setF({ ...f, subject: "", body: "" }); load(); })}>Submit</Button>
      </Stack></Card>
      {!d ? (loading ? <Loading /> : <ErrorBox msg={err || "Could not load your submissions."} />) : <DataTable empty="You have not submitted anything." rows={d} cols={[["Subject", (r) => r.subject], ["Category", (r) => r.category], ["Status", (r) => <Status s={r.status} />], ["Latest response", (r) => r.responses?.at(-1)?.text ?? "-"]]} />}
    </Page>
  );
}

export function Inbox() {
  const { d, err, loading, load } = useLoad<any>("/api/notifications"); const act = useAction();
  if (!d) return loading ? <Loading /> : <ErrorBox msg={err || "Could not load your inbox."} />;
  return (
    <Page title="Inbox" actions={<>
      {pushSupported() && <Button variant="outline" onClick={() => act(enablePush, "Push notifications enabled")}>Enable push notifications</Button>}
      <Button variant="outline" onClick={() => act(() => api("/api/notifications/read-all", { method: "POST" }), "Marked as read", load)}>Mark all read</Button></>}>
      {!d.items.length ? <Empty>No notifications.</Empty> : d.items.map((n: any) => <Card key={n.id} borderLeft={`5px solid ${n.read ? C.line : C.khaki}`}><Text fontWeight={n.read ? 400 : 700}>{n.title}</Text><Text fontSize="sm">{n.body}</Text><Text fontSize="xs" color="gray.500">{fmt(n.created_at)}</Text></Card>)}
    </Page>
  );
}
