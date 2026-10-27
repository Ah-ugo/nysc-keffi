import { ReactNode, useRef, useState } from "react";
import { Alert, AlertIcon, Box, Button, Flex, HStack, Spinner, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import { C } from "../theme";

export const Card = ({ children, ...p }: { children: ReactNode } & any) => <Box bg="white" borderWidth="1px" borderColor={C.line} borderRadius="md" p={4} {...p}>{children}</Box>;
export const Loading = () => <Flex justify="center" p={8}><Spinner color="brand.500" thickness="3px" /></Flex>;
export const Empty = ({ children }: { children: ReactNode }) => <Box borderWidth="1px" borderStyle="dashed" borderColor="#9fb3a5" borderRadius="md" p={6} color="gray.600" bg="whiteAlpha.600">{children}</Box>;
export const ErrorBox = ({ msg }: { msg: string }) => msg ? <Alert status="error" borderRadius="md"><AlertIcon />{msg}</Alert> : null;

const tone: Record<string, string> = { verified_present: C.green, admin_marked_present: "#6b46c1", pending_manual_review: C.amber, face_failed: C.red, location_failed: C.red, absent: "#6b7280", approved: C.green, rejected: C.red, pending: C.amber, completed: C.green, departed: C.blue, overdue: C.red, verified: C.green, pending_verification: C.amber, active: C.green, closed: "#6b7280", suspended: C.red, upcoming: C.blue, open: C.amber, resolved: C.green, in_review: C.blue, available: "#6b7280", occupied: C.green, reserved: C.amber, declined: C.red, cancelled: "#6b7280", passed: C.green, failed: C.red, review: C.amber, purged: "#6b7280", pending_review: C.amber, quality_checked: C.blue };
export const Status = ({ s }: { s: string }) => (
  <HStack as="span" display="inline-flex" spacing={1.5} fontWeight={600} fontSize="sm"><Box w="8px" h="8px" borderRadius="full" bg={tone[s] ?? "#6b7280"} /><Text as="span">{String(s).replace(/_/g, " ")}</Text></HStack>
);

/** Big-number tile with a coloured edge. */
export const Stat = ({ label, value, note, color = C.green }: { label: string; value: ReactNode; note?: ReactNode; color?: string }) => (
  <Box bg="white" borderWidth="1px" borderColor={C.line} borderLeft={`5px solid ${color}`} borderRadius="md" p={3} minW={0}>
    <Text fontSize="sm" color="gray.600">{label}</Text>
    <Text fontFamily="heading" fontSize="4xl" fontWeight={700} lineHeight={1} color={C.forest}>{value ?? "-"}</Text>
    {note && <Text fontSize="xs" color="gray.600" mt={1}>{note}</Text>}
  </Box>
);

export function DataTable({ cols, rows, empty = "Nothing to show yet." }: { cols: [string, (r: any) => ReactNode][]; rows: any[]; empty?: string }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <TableContainer bg="white" borderWidth="1px" borderColor={C.line} borderRadius="md">
      <Table size="sm"><Thead bg={C.forest}><Tr>{cols.map(([h]) => <Th key={h} color="white" textTransform="none" fontFamily="heading" fontSize="md" letterSpacing="0.02em" py={2}>{h}</Th>)}</Tr></Thead>
        <Tbody>{rows.map((r, i) => <Tr key={r.id ?? i} _odd={{ bg: "#f6f8f5" }}>{cols.map(([h, f]) => <Td key={h} py={2}>{f(r)}</Td>)}</Tr>)}</Tbody></Table>
    </TableContainer>
  );
}

export function Pager({ page, total, size, set }: { page: number; total: number; size: number; set: (n: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return <HStack className="no-print"><Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => set(page - 1)}>Previous</Button><Text fontSize="sm">Page {page} of {pages} ({total} records)</Text><Button size="sm" variant="outline" isDisabled={page >= pages} onClick={() => set(page + 1)}>Next</Button></HStack>;
}

export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false); const busyRef = useRef(false); const progressId = useRef(`action-${Math.random().toString(36).slice(2)}`);
  const run = async (fn: () => Promise<any>, ok = "Done", after?: () => void) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    toast({ id: progressId.current, status: "info", title: "Working…", description: "Please wait while this is saved.", duration: null, isClosable: false, position: "top" });
    try { await fn(); toast.close(progressId.current); toast({ status: "success", title: ok, duration: 3000, position: "top" }); after?.(); }
    catch (e: any) { toast.close(progressId.current); toast({ status: "error", title: e.message, duration: 7000, isClosable: true, position: "top" }); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return Object.assign(run, { busy });
}

/** The bed pass: the one signature object of the app. Printable. */
export function BedPass({ name, callup, stream, hostel, bunk, position, assigned }: { name: string; callup: string; stream: string; hostel: string; bunk: string; position: string; assigned: string }) {
  const notch = { content: '""', position: "absolute" as const, width: "22px", height: "22px", borderRadius: "full", bg: C.paper, top: "calc(50% - 11px)" };
  return (
    <Box position="relative" maxW="560px" bg="white" borderWidth="2px" borderColor={C.forest} borderRadius="md" overflow="hidden" sx={{ "@media print": { borderColor: "black" } }}>
      <Flex bg={C.forest} color="white" px={4} py={2} justify="space-between" align="center"><Text fontFamily="heading" fontSize="xl" fontWeight={700}>NYSC KEFFI ORIENTATION CAMP</Text><Text fontSize="sm">{stream}</Text></Flex>
      <Flex direction={{ base: "column", sm: "row" }} position="relative">
        <Box flex={1} p={4}><Text fontSize="sm" color="gray.600">Corps member</Text><Text fontWeight={700} fontSize="lg">{name}</Text><Text fontSize="sm" color="gray.600" mt={2}>Call-up number</Text><Text fontWeight={600} letterSpacing="0.04em">{callup}</Text><Text fontSize="sm" color="gray.600" mt={2}>Assigned</Text><Text>{assigned}</Text></Box>
        <Box borderLeft={{ sm: `2px dashed ${C.line}` }} borderTop={{ base: `2px dashed ${C.line}`, sm: "none" }} p={4} minW="210px" bg={C.forest} color="white" textAlign="center" sx={{ "@media print": { bg: "white", color: "black", borderLeft: "2px dashed black" } }}>
          <Text fontSize="sm" color="#b9d4c4" sx={{ "@media print": { color: "black" } }}>Hostel {hostel} · Bunk {bunk.split("-").pop()}</Text>
          <Text fontFamily="heading" fontSize="6xl" fontWeight={700} lineHeight={1} color={C.khaki} sx={{ "@media print": { color: "black" } }}>{hostel}-{bunk.split("-").pop()}</Text>
          <Text fontFamily="heading" fontSize="3xl" fontWeight={600}>{position === "upper" ? "UPPER BUNK" : "LOWER BUNK"}</Text>
        </Box>
      </Flex>
    </Box>
  );
}
