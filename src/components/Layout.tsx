import { CSSProperties, ReactNode, useEffect, useState } from "react";
import { Badge, Box, Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerOverlay, Flex, Heading, HStack, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { C } from "../theme";
import { Icon } from "./Icon";

export type NavItem = { to: string; label: string; icon: string };

export function Shell({ nav, title, bottom }: { nav: NavItem[]; title: string; bottom?: string[] }) {
  const { logout, me } = useAuth(); const go = useNavigate(); const location = useLocation();
  const more = useDisclosure();
  const [unread, setUnread] = useState(0); const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const f = () => setOnline(navigator.onLine); addEventListener("online", f); addEventListener("offline", f);
    api("/api/notifications").then((r) => setUnread(r.unread)).catch(() => {});
    return () => { removeEventListener("online", f); removeEventListener("offline", f); };
  }, []);
  const mobileNav = nav.filter((n) => !bottom || bottom.includes(n.to));
  const moreNav = nav.filter((n) => !mobileNav.some((visible) => visible.to === n.to));
  const link = (n: NavItem, mobile = false) => (
    <NavLink key={n.to} to={n.to} end={n.to === "/app" || n.to === "/director"} style={({ isActive }) => ({ display: "flex", alignItems: "center", gap: mobile ? 2 : 12, flexDirection: mobile ? "column" : "row", padding: mobile ? "8px 4px" : "9px 12px", fontSize: mobile ? 11 : 15, fontWeight: 500, color: isActive ? "#fff" : "#b9d4c4", background: isActive && !mobile ? "rgba(255,255,255,.1)" : "transparent", borderLeft: !mobile ? `3px solid ${isActive ? C.khaki : "transparent"}` : undefined, borderTop: mobile ? `3px solid ${isActive ? C.khaki : "transparent"}` : undefined, flex: mobile ? 1 : undefined, position: "relative" } as CSSProperties)}>
      <Icon n={n.icon} size={mobile ? 22 : 18} /><span>{n.label}</span>
      {n.label === "Inbox" && unread > 0 && <Badge position={mobile ? "absolute" : "static"} top="2px" right="22%" colorScheme="yellow" borderRadius="full">{unread}</Badge>}
    </NavLink>
  );
  return (
    <Flex minH="100vh">
      <Flex className="no-print" display={{ base: "none", md: "flex" }} direction="column" bg={C.forest} color="white" w="244px" flexShrink={0} position="sticky" top={0} h="100vh" py={5}>
        <Box px={5} mb={5}><Heading size="lg" lineHeight={1}>{title}</Heading><Text fontSize="sm" color="#9fc3ae" mt={1}>{me?.role === "member" ? me.profile?.stream_label : "NYSC Keffi Orientation Camp"}</Text></Box>
        <Stack spacing={0} flex={1} overflowY="auto">{nav.map((n) => link(n))}</Stack>
        <Box as="button" onClick={() => { logout(); go("/login"); }} display="flex" alignItems="center" gap={3} px={5} py={3} color="#b9d4c4" _hover={{ color: "white" }}><Icon n="logout" size={18} />Sign out</Box>
      </Flex>
      <Box flex={1} minW={0} pb={{ base: "76px", md: 0 }}>
        <Flex className="no-print" display={{ base: "flex", md: "none" }} bg={C.forest} color="white" px={4} py={3} justify="space-between" align="center" position="sticky" top={0} zIndex={5}>
          <Heading size="md">{title}</Heading>
          <Box as="button" onClick={() => { logout(); go("/login"); }} aria-label="Sign out"><Icon n="logout" /></Box>
        </Flex>
        {!online && <Box className="no-print" bg={C.amber} color="black" p={2} fontSize="sm" textAlign="center">Offline: submissions are disabled until you reconnect. Nothing is saved as submitted.</Box>}
        <Box p={{ base: 4, md: 8 }} maxW="1240px"><Outlet /></Box>
      </Box>
      <Flex className="no-print" display={{ base: "flex", md: "none" }} position="fixed" bottom={0} left={0} right={0} bg={C.forest} zIndex={10} pb="env(safe-area-inset-bottom)">
        {mobileNav.map((n) => link(n, true))}
        {moreNav.length > 0 && <Box as="button" onClick={more.onOpen} aria-label="More pages" aria-current={moreNav.some((n) => location.pathname === n.to) ? "page" : undefined} display="flex" alignItems="center" justifyContent="center" gap={1} flexDirection="column" flex={1} py="8px" px="4px" fontSize="11px" color={moreNav.some((n) => location.pathname === n.to) ? "white" : "#b9d4c4"} borderTop="3px solid" borderColor={moreNav.some((n) => location.pathname === n.to) ? C.khaki : "transparent"}><Icon n="layers" size={22} /><span>More</span></Box>}
      </Flex>
      <Drawer isOpen={more.isOpen} placement="bottom" onClose={more.onClose}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="xl" pb="env(safe-area-inset-bottom)">
          <DrawerHeader borderBottomWidth="1px">More pages</DrawerHeader>
          <DrawerBody py={2}>
            <Stack spacing={1}>
              {moreNav.map((n) => <NavLink key={n.to} to={n.to} onClick={more.onClose} style={({ isActive }) => ({ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 8, color: isActive ? C.forest : "#27352d", background: isActive ? "#e7efe9" : "transparent", fontWeight: isActive ? 700 : 500 })}>
                <Icon n={n.icon} size={20} /><span>{n.label}</span>
                {n.label === "Inbox" && unread > 0 && <Badge ml="auto" colorScheme="yellow" borderRadius="full">{unread}</Badge>}
              </NavLink>)}
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}

export const Page = ({ title, sub, actions, children }: { title: string; sub?: string; actions?: ReactNode; children: ReactNode }) => (
  <Stack spacing={5}>
    <Flex justify="space-between" align="flex-end" wrap="wrap" gap={3} borderBottom={`2px solid ${C.forest}`} pb={2}>
      <Box><Heading size="xl" color={C.forest} lineHeight={1.05}>{title}</Heading>{sub && <Text color="gray.600" fontSize="sm">{sub}</Text>}</Box>
      <HStack className="no-print" wrap="wrap">{actions}</HStack>
    </Flex>
    {children}
  </Stack>
);
