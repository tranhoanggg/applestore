import React, { useEffect } from "react";
import ModelSlider3D from "../ModelSlider3D/ModelSlider3D";
import ProductList from "../ProductList/ProductList";

function HomePage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <React.Fragment>
      <ModelSlider3D />

      <ProductList
        title="Mọi phiên bản iPhone"
        apiEndpoint="iphones"
        productType="Iphone"
        itemRoutePrefix="iphone"
        buyRoute="/buyPhone"
      />

      <ProductList
        title="Lựa chọn chiếc iPad của bạn"
        apiEndpoint="ipads"
        productType="Ipad"
        itemRoutePrefix="ipad"
        buyRoute="/buyIpad"
      />

      <ProductList
        title="Mac - Người bạn đồng hành tin cậy"
        apiEndpoint="macs"
        productType="Mac"
        itemRoutePrefix="mac"
        buyRoute="/buyMac"
      />

      <ProductList
        title="Apple Watch - Thời thượng"
        apiEndpoint="watchs"
        productType="Watch"
        itemRoutePrefix="watch"
        buyRoute="/buyWatch"
      />

      <ProductList
        title="Âm thanh tuyệt hảo cùng AirPods & Beats"
        apiEndpoint="earphones"
        productType="Earphone"
        itemRoutePrefix="earphone"
        buyRoute="/buyEarphone"
      />

      <ProductList
        title="Phụ kiện & Tiện ích Apple"
        apiEndpoint="accessories"
        productType="Accessory"
        itemRoutePrefix="accessory"
        buyRoute="/buyAccessory"
      />
    </React.Fragment>
  );
}

export default HomePage;
