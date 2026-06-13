"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Environment, Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// We will fetch the TN polygon data dynamically or use a fallback
// For now, let's define a rough simplified polygon for Tamil Nadu
const TN_FALLBACK = [
  [-1.5, 4.0], // Hosur/Krishnagiri area
  [0.5, 4.0], // Vellore area
  [3.0, 4.5], // Chennai area
  [3.2, 3.5], // Kanchipuram coast
  [2.5, 2.0], // Cuddalore/Puducherry
  [3.8, 0.5], // Point Calimere / Nagapattinam
  [3.0, -1.0], // Ramanathapuram
  [2.2, -2.5], // Thoothukudi
  [1.0, -4.5], // Kanyakumari (Bottom tip)
  [-0.2, -3.0], // Nagercoil / Kerala border
  [-1.5, -1.0], // Theni / Ghats
  [-2.2, 1.0], // Coimbatore / Nilgiris
  [-1.8, 2.5], // Erode/Salem
  [-1.5, 4.0], // Close loop
];

function TNMesh({ points, isHovered, setHovered }: { points: number[][]; isHovered: boolean; setHovered: (v: boolean) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create Extrude Geometry from points
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    if (points.length > 0) {
      shape.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i][0], points[i][1]);
      }
      shape.lineTo(points[0][0], points[0][1]); // close
    }
    
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.8,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.1,
      bevelThickness: 0.1,
      curveSegments: 12
    });
  }, [points]);

  // Center geometry
  useMemo(() => {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (box) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);
    }
  }, [geometry]);

  // Gentle idle rotation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={1.5}>
        <mesh
          ref={meshRef}
          geometry={geometry}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={isHovered ? 1.05 : 1}
        >
          {/* Glass/Gold premium material */}
          <meshPhysicalMaterial
            color={isHovered ? "#FFB000" : "#F59E0B"}
            emissive={isHovered ? "#452000" : "#201000"}
            metalness={0.8}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            transmission={0.4}
            thickness={2.0}
          />
        </mesh>

        {/* Outer glowing outline/wireframe */}
        <mesh geometry={geometry} scale={1.01}>
          <meshBasicMaterial color="#FCD34D" wireframe opacity={0.15} transparent />
        </mesh>
      </Float>
    </group>
  );
}

// Key cities for markers
const CITIES = [
  { name: "Chennai",    pos: [2.5, 3.5, 0.5] },
  { name: "Coimbatore", pos: [-1.8, 1.0, 0.5] },
  { name: "Madurai",    pos: [0.5, -1.0, 0.5] },
  { name: "Kanyakumari",pos: [0.2, -3.8, 0.5] }
];

export default function TamilNadu3DMap() {
  const [isHovered, setHovered] = useState(false);
  const [points, setPoints] = useState<number[][]>(TN_FALLBACK);

  // Attempt to load the python generated points, or fallback
  useEffect(() => {
    import('./TnMapData')
      .then(mod => {
        if (mod.TN_POINTS && mod.TN_POINTS.length > 0) {
          setPoints(mod.TN_POINTS);
        }
      })
      .catch(() => {
        console.log("Using fallback TN map coordinates");
      });
  }, []);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} color="#fff1e6" />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#fbbf24" />
        
        {/* Environment map for reflections */}
        <Environment preset="city" />

        <TNMesh points={points} isHovered={isHovered} setHovered={setHovered} />

        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.5}
          autoRotate={!isHovered}
          autoRotateSpeed={1.5}
        />
      </Canvas>
    </div>
  );
}
