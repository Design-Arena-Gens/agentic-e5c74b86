"use client";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

type SceneProps = {
  isPlaying: boolean;
};

export default function Scene({ isPlaying }: SceneProps) {
  // Refs for animated parts
  const mouthRef = useRef<THREE.Mesh>(null);
  const coneGroupRef = useRef<THREE.Group>(null);
  const scoopRef = useRef<THREE.Mesh>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const playingRef = useRef<boolean>(false);

  // Materials
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xffd7b5, roughness: 0.6, metalness: 0.0 }), []);
  const hair = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x2f2a44, roughness: 0.9 }), []);
  const dress = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x3a5ad9, roughness: 0.9 }), []);
  const coneMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xb67c3b, roughness: 1.0 }), []);
  const lava = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xff6a00,
        emissive: 0xff4500,
        emissiveIntensity: 2.5,
        roughness: 0.4,
        metalness: 0.1,
      }),
    []
  );

  // Geometry
  const mouthGeom = useMemo(() => new THREE.BoxGeometry(0.3, 0.06, 0.06), []);

  // Start/stop the timeline
  if (isPlaying && !playingRef.current) {
    playingRef.current = true;
    clockRef.current.start();
    clockRef.current.elapsedTime = 0;
  } else if (!isPlaying && playingRef.current) {
    playingRef.current = false;
    clockRef.current.stop();
  }

  useFrame(() => {
    if (!playingRef.current) return;
    const t = clockRef.current.getElapsedTime();

    // Timeline (seconds):
    // 0-1.5s: cone moves from right to mouth
    // 1.2-2.8s: mouth open/close chewing
    // 2.8-3.5s: scoop shrinks (eaten)
    // 3.5-6.0s: idle smile

    // Move cone
    const cone = coneGroupRef.current;
    if (cone) {
      const start = new THREE.Vector3(1.8, 1.1, 0.6);
      const end = new THREE.Vector3(0.0, 1.2, 0.5);
      let k = Math.min(1, t / 1.5);
      // Ease out
      k = 1 - Math.pow(1 - k, 3);
      const pos = start.clone().lerp(end, k);
      cone.position.copy(pos);
      cone.rotation.z = -0.6 + 0.4 * k; // tilt toward mouth
    }

    // Mouth open/close
    const mouth = mouthRef.current;
    if (mouth) {
      const chew = Math.max(0, Math.min(1, (t - 1.1) / 1.7));
      const phase = Math.sin(t * 5.2) * chew;
      const open = 0.06 + 0.12 * Math.max(0, phase);
      mouth.scale.y = Math.max(0.05, open / 0.06);
    }

    // Shrink scoop as it's eaten
    const scoop = scoopRef.current;
    if (scoop) {
      const shrink = Math.max(0, Math.min(1, (t - 2.6) / 0.9));
      const s = THREE.MathUtils.lerp(1, 0.05, shrink);
      scoop.scale.setScalar(s);
      // Pulsating emissive while being eaten
      const pulse = 1 + 0.6 * Math.sin(t * 6);
      (scoop.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5 * pulse;
    }

    // Stop after ~6s
    if (t > 6.0) {
      playingRef.current = false;
      clockRef.current.stop();
    }
  });

  return (
    <group>
      {/* Ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={0x0e1424} roughness={1} />
      </mesh>

      {/* Simple stylized girl */}
      <group position={[0, 0, 0]}>
        {/* Body */}
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.35, 0.5, 1.2, 16]} />
          <primitive object={dress} attach="material" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.35, 24, 24]} />
          <primitive object={skin} attach="material" />
        </mesh>
        {/* Hair cap */}
        <mesh position={[0, 1.78, -0.02]}>
          <sphereGeometry args={[0.37, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
          <primitive object={hair} attach="material" />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.12, 1.72, 0.31]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color={0x111111} />
        </mesh>
        <mesh position={[0.12, 1.72, 0.31]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color={0x111111} />
        </mesh>
        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, 1.60, 0.33]}>
          <primitive object={mouthGeom} attach="geometry" />
          <meshStandardMaterial color={0x772233} roughness={0.6} />
        </mesh>
      </group>

      {/* Ice cream (cone + lava scoop) */}
      <group ref={coneGroupRef} position={[1.8, 1.1, 0.6]} rotation={[0, 0, -0.6]}>
        {/* Cone */}
        <mesh position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.13, 0.3, 16]} />
          <primitive object={coneMat} attach="material" />
        </mesh>
        {/* Scoop */}
        <mesh ref={scoopRef} position={[0, 0.03, 0]}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <primitive object={lava} attach="material" />
        </mesh>
      </group>
    </group>
  );
}
