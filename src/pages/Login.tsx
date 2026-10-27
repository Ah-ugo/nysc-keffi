import { useState } from "react";
import { Box, Button, Flex, FormControl, FormLabel, Heading, Input, Stack, Text, Link } from "@chakra-ui/react";
import { Link as RLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { ErrorBox } from "../components/ui";
import { C } from "../theme";

export default function Login() {
  const { login } = useAuth(); const go = useNavigate();
  const [id, setId] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const role = await login(id, pw); go(role === "director" ? "/director" : role === "platoon_officer" ? "/officer" : "/app"); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Flex minH="100vh" direction={{ base: "column", md: "row" }}>
      <Flex flex={1} bg={C.forest} color="white" direction="column" justify="space-between" p={{ base: 6, md: 12 }} minH={{ base: "200px", md: "auto" }}>
        <Text fontFamily="heading" fontSize="lg" color={C.khaki} fontWeight={600}>National Youth Service Corps</Text>
        <Box><Heading fontSize={{ base: "6xl", md: "9xl" }} lineHeight={0.85}>Keffi</Heading><Heading fontSize={{ base: "2xl", md: "4xl" }} color={C.khaki} mt={2}>Orientation Camp</Heading>
          <Text mt={4} maxW="420px" color="#b9d4c4" display={{ base: "none", md: "block" }}>Your bed, your attendance, your exit requests and camp notices in one place.</Text></Box>
        <Box display={{ base: "none", md: "block" }} h="6px" w="120px" bg={C.khaki} />
      </Flex>
      <Flex flex={1} align="center" justify="center" p={6}>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 400 }}><Stack spacing={4}>
          <Heading size="xl" color={C.forest}>Sign in</Heading>
          <ErrorBox msg={err} />
          <FormControl isRequired><FormLabel>Call-up number or staff username</FormLabel><Input bg="white" size="lg" value={id} onChange={(e) => setId(e.target.value)} autoCapitalize="characters" autoComplete="username" /></FormControl>
          <FormControl isRequired><FormLabel>Password</FormLabel><Input bg="white" size="lg" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></FormControl>
          <Button type="submit" size="lg" isLoading={busy}>Sign in</Button>
          <Text fontSize="sm">New arrival? After your call-up letter is inspected, scan the QR code at the registration point, or <Link as={RLink} to="/register" color="brand.600" fontWeight={600}>register here</Link>. The Camp Director signs in with the same form.</Text>
          <Link as={RLink} to="/privacy" fontSize="sm" color="gray.600">Privacy notice</Link>
        </Stack></form>
      </Flex>
    </Flex>
  );
}
