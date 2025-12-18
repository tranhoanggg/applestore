import React, { useEffect, useState } from "react";
import "./IphonePage.css";
import { useNavigate } from "react-router-dom";

function IphonePage() {
  const navigate = useNavigate();
  const [iphones, setIphones] = useState([]);
  const [activeColors, setActiveColors] = useState({});
  const [pageVisible, setPageVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setPageVisible(true);
    });
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/iphones")
      .then((res) => res.json())
      .then((data) => {
        const grouped = {};
        const initialActive = {};

        data.forEach((item) => {
          const name = item.name.trim();

          if (!grouped[name]) {
            grouped[name] = {
              name,
              products: [],
              colors: [],
              prices: [],
              hasNew: false,
              colorMap: {},
            };
          }

          grouped[name].products.push(item);

          if (!grouped[name].colors.some((c) => c.code === item.code)) {
            grouped[name].colors.push({
              code: item.code,
              folder: item.image,
            });
          }

          grouped[name].colorMap[item.code] = item.image;
          grouped[name].prices.push(item.price);

          if (item.tag === "new") grouped[name].hasNew = true;
        });

        Object.values(grouped).forEach((p) => {
          initialActive[p.name] = p.colors[0]?.code;
        });

        setActiveColors(initialActive);
        setIphones(Object.values(grouped));
      })
      .catch(console.error);
  }, []);

  const formatMoney = (price) => price.toLocaleString("vi-VN") + "đ";

  const handleColorSelect = (name, color) => {
    setActiveColors((prev) => ({
      ...prev,
      [name]: color,
    }));
  };

  const handleBuyNow = (iphone) => {
    const client = localStorage.getItem("client");

    if (!client) {
      navigate("/login", {
        state: {
          redirectTo: "/buyPhone",
          payload: {
            product_name: iphone.name,
            product_type: "Iphone",
          },
        },
      });
      return;
    }

    navigate("/buyPhone", {
      state: {
        product_name: iphone.name,
        product_type: "Iphone",
      },
    });
  };

  return (
    <section
      className={`iphonepage-container ${
        pageVisible ? "page-enter-active" : "page-enter"
      }`}
    >
      <h2 className="iphonepage-title">Mọi phiên bản iPhone</h2>

      <div className="iphonepage-grid">
        {iphones.map((iphone) => {
          const minPrice = Math.min(...iphone.prices);
          const maxPrice = Math.max(...iphone.prices);
          const activeColor = activeColors[iphone.name];

          return (
            <article key={iphone.name} className="iphonepage-card">
              {iphone.hasNew && (
                <img
                  className="iphonepage-badge"
                  src={require("../../assets/images/hot.png")}
                  alt="New"
                />
              )}

              <h3 className="iphonepage-name">{iphone.name}</h3>

              <div className="iphonepage-image">
                <img
                  src={`/assets/images/Iphone/${iphone.name
                    .toLowerCase()
                    .replace(/\s+/g, "")}/${
                    iphone.colorMap[activeColor]
                  }/1.png`}
                  alt={iphone.name}
                />
              </div>

              {/* COLOR DOT */}
              <div className="iphonepage-colors">
                {iphone.colors.map((c) => (
                  <span
                    key={c.code}
                    className={
                      "color-dot" + (activeColor === c.code ? " active" : "")
                    }
                    style={{ backgroundColor: c.code }}
                    onClick={() => handleColorSelect(iphone.name, c.code)}
                  />
                ))}
              </div>

              <p className="iphonepage-price">
                Từ <b>{formatMoney(minPrice)}</b> –{" "}
                <b>{formatMoney(maxPrice)}</b>
              </p>

              <div className="iphonepage-actions">
                <button
                  className="btn info"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/iphone/${iphone.name}`);
                  }}
                >
                  THÔNG TIN SẢN PHẨM
                </button>
                <button
                  className="btn buy"
                  onClick={() => handleBuyNow(iphone)}
                >
                  MUA NGAY
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default IphonePage;
