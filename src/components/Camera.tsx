import { useEffect, useRef, useState } from "react";
import { Alert, AlertIcon, Box, Button, Image, Stack, Text } from "@chakra-ui/react";

/** Live camera capture (no gallery upload, so attendance photos are always fresh). */
export function Camera({ label, hint, onCapture }: { label: string; hint: string; onCapture: (b: Blob | null) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [err, setErr] = useState("");

  const stop = () => stream.current?.getTracks().forEach((t) => t.stop());
  const start = async () => {
    setErr("");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "user" }, aspectRatio: { ideal: 4 / 3 }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      if (video.current) { video.current.srcObject = stream.current; await video.current.play(); }
    } catch { setErr("Camera blocked. Allow camera access in your browser settings (the page must use HTTPS) and try again."); }
  };
  useEffect(() => { start(); return stop; }, []);

  const snap = () => {
    const v = video.current!; const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((b) => { if (b) { setPreview(URL.createObjectURL(b)); onCapture(b); stop(); } }, "image/jpeg", 0.92);
  };
  const retake = () => { setPreview(""); onCapture(null); start(); };

  return (
    <Stack spacing={2}>
      <Text fontWeight="600">{label}</Text>
      <Text fontSize="sm" color="gray.600">{hint}</Text>
      {err && <Alert status="error" fontSize="sm"><AlertIcon />{err}</Alert>}
      <Box borderRadius="md" overflow="hidden" bg="black" maxW="360px">
        {preview ? <Image src={preview} alt="Captured" /> : <video ref={video} playsInline muted style={{ width: "100%", transform: "scaleX(-1)" }} />}
      </Box>
      {preview ? <Button variant="outline" onClick={retake} maxW="360px">Retake photo</Button> : <Button onClick={snap} maxW="360px">Take photo</Button>}
    </Stack>
  );
}
