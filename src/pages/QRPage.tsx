import { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, FormControl, FormLabel, Heading, Input, Select, Stack, Text, OrderedList, ListItem } from "@chakra-ui/react";
import QRCode from "qrcode";
import { api } from "../api";
import { Page } from "../components/Layout";
import { Empty, Loading, useAction } from "../components/ui";
import { C } from "../theme";

/** Registration-desk poster. The QR only opens the registration page; identity is confirmed by the Director afterwards. */
export default function QRPage() {
  const act = useAction();
  const [streams, setStreams] = useState<any[] | null>(null); const [sid, setSid] = useState("");
  const [base, setBase] = useState(location.origin); const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => { api("/api/streams").then((s: any[]) => { const a = s.filter((x) => x.status === "active"); setStreams(a); if (a[0]) setSid(a[0].id); }); }, []);
  const stream = streams?.find((s) => s.id === sid);
  const url = `${base.replace(/\/$/, "")}/register?stream=${sid}`;
  useEffect(() => { if (sid && canvas.current) QRCode.toCanvas(canvas.current, url, { width: 520, margin: 2, errorCorrectionLevel: "M", color: { dark: C.forest, light: "#ffffff" } }); }, [url, sid]);
  if (!streams) return <Loading />;
  return (
    <Page title="Registration QR code" sub="Display this at the registration point after call-up letters are inspected."
      actions={<><Button variant="outline" onClick={() => act(() => navigator.clipboard.writeText(url), "Link copied")}>Copy link</Button>
        <Button variant="outline" onClick={() => { const a = document.createElement("a"); a.href = canvas.current!.toDataURL("image/png"); a.download = `register-${stream?.label.replace(/ /g, "-")}.png`; a.click(); }} isDisabled={!sid}>Save PNG</Button>
        <Button onClick={() => window.print()} isDisabled={!sid}>Print poster</Button></>}>
      {!streams.length ? <Empty>No active stream. Activate a stream on the Streams page; only active streams accept registrations.</Empty> : <>
        <Flex className="no-print" gap={4} wrap="wrap" align="flex-end">
          <FormControl maxW="320px"><FormLabel>Stream</FormLabel><Select bg="white" value={sid} onChange={(e) => setSid(e.target.value)}>{streams.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select></FormControl>
          <FormControl maxW="420px"><FormLabel>Public address of this app</FormLabel><Input bg="white" value={base} onChange={(e) => setBase(e.target.value)} /></FormControl>
          <Text fontSize="sm" color="gray.600" maxW="320px">Corps members' phones must be able to open this address over HTTPS (camera access requires it). Do not use localhost on the poster.</Text></Flex>
        <Flex id="poster" direction="column" align="center" bg="white" borderWidth="3px" borderColor={C.forest} p={{ base: 4, md: 8 }} textAlign="center" sx={{ "@media print": { borderColor: "black", minH: "95vh", justifyContent: "center" } }}>
          <Text fontFamily="heading" fontSize="2xl" fontWeight={600} color="brand.600">NYSC KEFFI ORIENTATION CAMP</Text>
          <Heading fontSize={{ base: "5xl", md: "8xl" }} color={C.forest} lineHeight={0.9}>Scan to register</Heading>
          <Text fontFamily="heading" fontSize="3xl" fontWeight={600} mt={1}>{stream?.label}</Text>
          <Box my={4} maxW="100%"><canvas ref={canvas} style={{ maxWidth: "100%", height: "auto" }} /></Box>
          <OrderedList textAlign="left" fontSize="lg" spacing={1}>
            <ListItem>Have your call-up letter inspected at the gate first.</ListItem><ListItem>Scan this code with your phone camera.</ListItem><ListItem>Fill in your details and take two face photos in good light.</ListItem></OrderedList>
          <Text fontSize="xs" color="gray.500" mt={3} wordBreak="break-all">{url}</Text>
        </Flex></>}
    </Page>
  );
}
