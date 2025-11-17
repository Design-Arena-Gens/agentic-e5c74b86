"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { OrbitControls, Environment, Effects } from "@react-three/drei";
import { Bloom } from "postprocessing";
import Scene from "../components/Scene";

export default function Page() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const handleCreated = useCallback(({ gl }: any) => {
    canvasRef.current = gl.domElement as HTMLCanvasElement;
  }, []);

  const startRecording = async (durationMs = 6000) => {
    if (!canvasRef.current || isRecording) return;
    setDownloadUrl(null);
    setIsRecording(true);
    setStatus("Recording...");

    const stream = canvasRef.current.captureStream(60);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 6_000_000,
    });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus("Recording complete.");
      setIsRecording(false);
    };
    recorderRef.current = recorder;
    recorder.start();

    // Ensure animation plays while recording
    setIsPlaying(true);

    setTimeout(() => {
      recorder.stop();
    }, durationMs);
  };

  const playOnce = () => {
    // Trigger a single animation pass (~6s)
    setIsPlaying(false);
    requestAnimationFrame(() => setIsPlaying(true));
  };

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div style={{ flex: 1, position: "relative", background: "#0b0f1a" }}>
        <Canvas onCreated={handleCreated} camera={{ position: [2.5, 1.8, 3.2], fov: 50 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} />
            <Environment preset="city" />
            {/* Bloom for lava glow */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Effects disableGamma>
              {/* @ts-ignore - type for Bloom from postprocessing */}
              <bloom
                intensity={1.2}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
                height={300}
              />
            </Effects>
            <Scene isPlaying={isPlaying} />
            <OrbitControls enablePan={false} enableZoom={false} />
          </Suspense>
        </Canvas>

        <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 12 }}>
          <button
            onClick={playOnce}
            disabled={isRecording}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #334", background: "#1c2436", color: "#fff", cursor: "pointer" }}
          >
            Play Animation
          </button>
          <button
            onClick={() => startRecording(6500)}
            disabled={isRecording}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #633", background: isRecording ? "#502" : "#7a1122", color: "#fff", cursor: isRecording ? "not-allowed" : "pointer" }}
          >
            {isRecording ? "Recording..." : "Record 6.5s Video"}
          </button>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download="lava-icecream.webm"
              style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2a4", background: "#184", color: "#fff", textDecoration: "none" }}
            >
              Download Video
            </a>
          )}
        </div>

        <div style={{ position: "absolute", bottom: 12, left: 16, color: "#cbd5e1", fontSize: 13, opacity: 0.9 }}>
          {status}
        </div>
      </div>
    </div>
  );
}
