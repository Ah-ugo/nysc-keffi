import { Box, Heading, ListItem, Stack, Text, UnorderedList, Link } from "@chakra-ui/react";
import { Link as RLink } from "react-router-dom";
import { C } from "../theme";

// DRAFT NOTICE: have the camp's Data Protection Officer / counsel review and complete before launch (controller name, DPO contact, retention).
export default function Privacy() {
  return (
    <Box maxW="720px" mx="auto" p={{ base: 5, md: 10 }}><Stack spacing={4}>
      <Heading size="2xl" color={C.forest}>Privacy notice</Heading>
      <Text color="gray.600">NYSC Keffi Orientation Camp management app. Draft for review by the camp's Data Protection Officer under the Nigeria Data Protection Act 2023.</Text>
      <Heading size="lg">What we collect</Heading>
      <UnorderedList><ListItem>Identity and contact details: name, call-up number, state, gender, phone, email.</ListItem><ListItem>Face photographs: two enrolment photos (front and side) and a fresh photo each time you submit weekly attendance.</ListItem><ListItem>Your location, once, at the moment you submit attendance (coordinates and GPS accuracy). We do not track you continuously.</ListItem><ListItem>Camp records: bed assignment, exit requests, attendance results, complaints.</ListItem></UnorderedList>
      <Heading size="lg">Why</Heading>
      <Text>To register you, allocate accommodation, verify weekly attendance, process exit requests and run the camp. Face photographs are sensitive personal data and are used only to check that the person submitting attendance is the registered corps member. You consent to this at registration.</Text>
      <Heading size="lg">Who can see it</Heading>
      <Text>Only the Camp Director can view enrolment and attendance photographs. Photos are stored privately (no public links) and each viewing is recorded. You see your own profile, bed, attendance results and requests.</Text>
      <Heading size="lg">Automated decisions</Heading>
      <Text>A failed or unclear automatic face or location check is never treated as a disciplinary finding. It goes to the Camp Director for human review, who can correct it.</Text>
      <Heading size="lg">How long we keep it</Heading>
      <UnorderedList><ListItem>Attendance photographs: deleted automatically after 30 days (configurable).</ListItem><ListItem>Enrolment photographs: deleted when your stream is closed and reviewed.</ListItem><ListItem>Attendance results, bed history and the audit trail: kept as camp records. [Retention period to be confirmed by the DPO.]</ListItem></UnorderedList>
      <Heading size="lg">Your rights</Heading>
      <Text>You may ask to access, correct or, where the law allows, delete your data, and to withdraw consent for face verification (the Camp Director will then verify your attendance manually). Contact: [Camp Director's office / DPO contact to be inserted].</Text>
      <Link as={RLink} to="/login" color="brand.600" fontWeight={600}>Back to sign in</Link>
    </Stack></Box>
  );
}
