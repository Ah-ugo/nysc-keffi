import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Checkbox, Flex, FormControl, FormLabel, Heading, HStack, Input, ListItem, Select, Stack, Text, UnorderedList, Link } from "@chakra-ui/react";
import { Link as RLink, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { Camera } from "../components/Camera";
import { ErrorBox } from "../components/ui";
import { C } from "../theme";

const STEPS = ["Your details", "Face photos", "Confirm"];

export default function Register() {
  const [qs] = useSearchParams();
  const [streams, setStreams] = useState<{ id: string; label: string }[] | null>(null);
  const [f, setF] = useState<any>({ stream_id: qs.get("stream") ?? "", gender: "", state: "", state_code: "", full_name: "", callup: "", phone: "", email: "", password: "" });
  const [step, setStep] = useState(0);
  const [front, setFront] = useState<Blob | null>(null); const [side, setSide] = useState<Blob | null>(null);
  const [consent, setConsent] = useState(false); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState<any>(null);
  useEffect(() => { api("/api/public/streams").then(setStreams).catch((e) => { setStreams([]); setErr(e.message); }); }, []);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const locked = !!qs.get("stream") && streams?.some((s) => s.id === qs.get("stream"));
  const valid0 = f.stream_id && f.full_name.trim().length >= 3 && f.callup.trim().length >= 6 && f.state && f.gender && f.phone.length >= 7 && f.password.length >= 8;

  const submit = async () => {
    setErr(""); const fd = new FormData(); Object.entries(f).forEach(([k, v]) => fd.append(k, v as string));
    fd.append("consent", String(consent)); fd.append("front", front!, "front.jpg"); fd.append("side", side!, "side.jpg"); setBusy(true);
    try { setDone(await api("/api/register", { form: fd })); } catch (x: any) { setErr(x.message); if (/photo/i.test(x.message)) setStep(1); } finally { setBusy(false); }
  };

  if (done) return (
    <Box maxW="520px" mx="auto" p={6}><Alert status="success" flexDirection="column" alignItems="flex-start" borderRadius="md" p={5}>
      <AlertIcon /><AlertTitle fontSize="xl" fontFamily="heading">Registration received</AlertTitle>
      <AlertDescription>Call-up number <b>{done.callup}</b>, {done.stream}. Registration: <b>{done.registration_status.replace(/_/g, " ")}</b>. Face enrolment: <b>{done.biometric_status.replace(/_/g, " ")}</b>. The Camp Director will confirm your details. You can already sign in.</AlertDescription>
    </Alert><Button as={RLink} to="/login" mt={4} size="lg" w="full">Sign in</Button></Box>
  );

  return (
    <Box maxW="600px" mx="auto" p={{ base: 4, md: 8 }}>
      <Text fontFamily="heading" color="brand.600" fontWeight={600} fontSize="lg">NYSC Keffi Orientation Camp</Text>
      <Heading size="2xl" color={C.forest} mb={3}>Register</Heading>
      <HStack spacing={0} mb={5}>{STEPS.map((s, i) => (
        <Flex key={s} flex={1} direction="column"><Box h="6px" bg={i <= step ? C.green : C.line} mr={i < 2 ? 1 : 0} /><Text fontSize="sm" mt={1} fontWeight={i === step ? 700 : 400}>{i + 1}. {s}</Text></Flex>))}</HStack>
      <ErrorBox msg={err} />
      {step === 0 && <Stack spacing={4} mt={3}>
        <FormControl isRequired><FormLabel>Batch and stream</FormLabel>
          <Select bg="white" placeholder="Select" value={f.stream_id} onChange={set("stream_id")} isDisabled={locked}>{streams?.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select>
          {streams && !streams.length && <Text fontSize="sm" color="red.600" mt={1}>No stream is open for registration right now.</Text>}</FormControl>
        <FormControl isRequired><FormLabel>Full name (as on your call-up letter)</FormLabel><Input bg="white" value={f.full_name} onChange={set("full_name")} /></FormControl>
        <FormControl isRequired><FormLabel>Call-up number</FormLabel><Input bg="white" value={f.callup} onChange={set("callup")} autoCapitalize="characters" /></FormControl>
        <HStack align="flex-start"><FormControl isRequired><FormLabel>State of deployment</FormLabel><Input bg="white" value={f.state} onChange={set("state")} /></FormControl>
          <FormControl><FormLabel>NYSC state code</FormLabel><Input bg="white" inputMode="numeric" value={f.state_code} onChange={set("state_code")} /><Text fontSize="xs" color="gray.600">Used for platoon assignment. Enter the numeric code shown on your NYSC documents.</Text></FormControl>
          <FormControl isRequired><FormLabel>Gender</FormLabel><Select bg="white" placeholder="Select" value={f.gender} onChange={set("gender")}><option value="M">Male</option><option value="F">Female</option></Select></FormControl></HStack>
        <FormControl isRequired><FormLabel>Phone number</FormLabel><Input bg="white" type="tel" value={f.phone} onChange={set("phone")} /></FormControl>
        <FormControl><FormLabel>Email (optional)</FormLabel><Input bg="white" type="email" value={f.email} onChange={set("email")} /></FormControl>
        <FormControl isRequired><FormLabel>Create a password (8+ characters)</FormLabel><Input bg="white" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" /></FormControl>
        <Button size="lg" isDisabled={!valid0} onClick={() => setStep(1)}>Continue to photos</Button></Stack>}
      {step === 1 && <Stack spacing={5} mt={3}>
        <Box borderLeft={`5px solid ${C.khaki}`} bg="white" p={3}><Text fontWeight={700}>Before you start</Text>
          <UnorderedList fontSize="sm"><ListItem>Face the light: a window or lamp in front of you, never behind.</ListItem><ListItem>No cap or sunglasses. Keep your whole face in the frame.</ListItem><ListItem>Only you in the picture. Hold the phone steady at eye level.</ListItem></UnorderedList></Box>
        <Camera label="Photo 1: look straight at the camera" hint="Front-facing, neutral face." onCapture={setFront} />
        {front ? <Camera label="Photo 2: side profile" hint="Turn your head to one side, eyes forward." onCapture={setSide} /> : <Text fontSize="sm" color="gray.600">Photo 2 (side profile) opens after you take photo 1.</Text>}
        <HStack><Button variant="outline" onClick={() => setStep(0)}>Back</Button><Button flex={1} isDisabled={!front || !side} onClick={() => setStep(2)}>Continue</Button></HStack></Stack>}
      {step === 2 && <Stack spacing={4} mt={3}>
        <Box bg="white" p={4} borderWidth="1px" borderColor={C.line}>{[["Name", f.full_name], ["Call-up number", f.callup.toUpperCase()], ["State", f.state], ["Phone", f.phone]].map(([k, v]) => <Flex key={k} justify="space-between" py={1} borderBottom={`1px solid ${C.line}`}><Text color="gray.600">{k}</Text><Text fontWeight={600}>{v}</Text></Flex>)}</Box>
        <Checkbox isChecked={consent} onChange={(e) => setConsent(e.target.checked)} alignItems="flex-start"><Text fontSize="sm">I consent to my face photographs being processed to verify my weekly attendance and stored privately by camp administration for the camp period, as described in the <Link as={RLink} to="/privacy" target="_blank" color="brand.600" fontWeight={600}>privacy notice</Link>.</Text></Checkbox>
        <HStack><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button flex={1} size="lg" isDisabled={!consent} isLoading={busy} onClick={submit}>Submit registration</Button></HStack></Stack>}
    </Box>
  );
}
