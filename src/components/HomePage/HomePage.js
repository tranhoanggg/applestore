import React, { useEffect } from "react";
import ModelSlider3D from "../ModelSlider3D/ModelSlider3D";
import IphoneList from "../IphoneList/IphoneList";
import IpadList from "../IpadList/IpadList";
import MacList from "../MacList/MacList";
import WatchList from "../WatchList/WatchList";

function HomePage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <React.Fragment>
      <ModelSlider3D />
      <IphoneList />
      <IpadList />
      <MacList />
      <WatchList />
    </React.Fragment>
  );
}

export default HomePage;
