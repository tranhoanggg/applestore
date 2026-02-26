import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PhoneModelLoader = ({ url }) => {
  const { scene } = useGLTF(url);
  const modelRef = useRef();

  useFrame((state, delta) => {
    if (!modelRef.current) return;

    const targetScale = 32;
    const speed = 1;

    const rotationSpeed = 2;

    modelRef.current.scale.x = THREE.MathUtils.lerp(
      modelRef.current.scale.x,
      targetScale,
      delta * speed
    );
    modelRef.current.scale.y = THREE.MathUtils.lerp(
      modelRef.current.scale.y,
      targetScale,
      delta * speed
    );
    modelRef.current.scale.z = THREE.MathUtils.lerp(
      modelRef.current.scale.z,
      targetScale,
      delta * speed
    );

    const targetRotationY = Math.PI;

    modelRef.current.rotation.y = THREE.MathUtils.lerp(
      modelRef.current.rotation.y,
      targetRotationY,
      delta * rotationSpeed
    );
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={[0, 0, 0]}
      rotation={[0, Math.PI + 2 * 2 * Math.PI, 0]}
    />
  );
};

export default PhoneModelLoader;
