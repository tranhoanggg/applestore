import React from "react";
import { useGLTF } from "@react-three/drei";

const PhoneModelLoader = ({ url }) => {
  const { scene } = useGLTF(url);
  return (
    <primitive
      object={scene}
      scale={[32, 32, 32]} // TĂNG SCALE
      rotation={[0, Math.PI, 0]} // Quay lại đúng hướng nếu cần
    />
  );
};

export default PhoneModelLoader;
