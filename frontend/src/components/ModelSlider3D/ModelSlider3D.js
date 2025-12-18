import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import "./ModelSlider3D.css";

// Component load GLB
const PhoneModel = ({ url }) => {
  const Model = React.lazy(() => import("./PhoneModelLoader"));
  return (
    <Suspense fallback={null}>
      <Model url={url} />
    </Suspense>
  );
};

const ModelSlider3D = () => {
  const models = [
    {
      name: "Gold",
      path: "/assets/models/Iphone17PromaxGold/source/Phone.glb",
      color: "#d4af37",
      display: "iPhone 17 Pro Max in Gold",
    },
    {
      name: "Orange",
      path: "/assets/models/Iphone17PromaxOrange/source/Phone.glb",
      color: "#ff6a00",
      display: "iPhone 17 Pro Max in Oảnge",
    },
    {
      name: "Silver",
      path: "/assets/models/Iphone17PromaxSilver/source/Phone.glb",
      color: "#c0c0c0",
      display: "iPhone 17 Pro Max in Silver",
    },
  ];

  const [index, setIndex] = useState(0);

  return (
    <div className="slider-container">
      {/* TITLE */}
      <div className="text-header">
        <h2 className="slider-title">
          Cùng ngắm nhìn phiên bản iPhone 17 mới nhất
        </h2>
      </div>

      <div className="model-viewer">
        <Canvas camera={{ position: [0, 0, 4] }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} />
          <OrbitControls enableZoom={true} minDistance={2.5} maxDistance={6} />
          <PhoneModel url={models[index].path} />
        </Canvas>
      </div>

      {/* MODEL NAME */}
      <p className="model-name">{models[index].display}</p>

      {/* COLOR DOTS */}
      <div className="color-selector">
        <div className="color-dots-bg">
          {models.map((m, i) => (
            <div
              key={i}
              className={`dot ${i === index ? "active" : ""}`}
              style={{ background: m.color }}
              onClick={() => setIndex(i)}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelSlider3D;
