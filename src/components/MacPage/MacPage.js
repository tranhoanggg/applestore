import React, { useEffect, useState } from "react";
import "./MacPage.css";
import { useNavigate } from "react-router-dom";

function MacPage() {
  const navigate = useNavigate();
  const [macs, setMacs] = useState([]);
  const [activeColors, setActiveColors] = useState({});
  const [pageVisible, setPageVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setPageVisible(true);
    });
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/macs")
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
        setMacs(Object.values(grouped));
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

  const handleBuyNow = (mac) => {
    const client = localStorage.getItem("client");

    if (!client) {
      navigate("/login", {
        state: {
          redirectTo: "/buyMac",
          payload: {
            product_name: mac.name,
            product_type: "Mac",
          },
        },
      });
      return;
    }

    navigate("/buyMac", {
      state: {
        product_name: mac.name,
        product_type: "Mac",
      },
    });
  };

  return (
    <section
      className={`macpage-container ${
        pageVisible ? "page-enter-active" : "page-enter"
      }`}
    >
      <h2 className="macpage-title">Mac - Người bạn đồng hành tin cậy</h2>

      <div className="macpage-grid">
        {macs.map((mac) => {
          const minPrice = Math.min(...mac.prices);
          const maxPrice = Math.max(...mac.prices);
          const activeColor = activeColors[mac.name];

          return (
            <article key={mac.name} className="macpage-card">
              {mac.hasNew && (
                <img
                  className="macpage-badge"
                  src={require("../../assets/images/hot.png")}
                  alt="New"
                />
              )}

              <h3 className="macpage-name">{mac.name}</h3>

              <div className="macpage-image">
                <img
                  src={`/assets/images/Mac/${mac.name
                    .toLowerCase()
                    .replace(/\s+/g, "")}/${mac.colorMap[activeColor]}/1.png`}
                  alt={mac.name}
                />
              </div>

              {/* COLOR DOT */}
              <div className="macpage-colors">
                {mac.colors.map((c) => (
                  <span
                    key={c.code}
                    className={
                      "color-dot" + (activeColor === c.code ? " active" : "")
                    }
                    style={{ backgroundColor: c.code }}
                    onClick={() => handleColorSelect(mac.name, c.code)}
                  />
                ))}
              </div>

              <p className="macpage-price">
                Từ <b>{formatMoney(minPrice)}</b> –{" "}
                <b>{formatMoney(maxPrice)}</b>
              </p>

              <div className="macpage-actions">
                <button
                  className="btn info"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/mac/${mac.name}`);
                  }}
                >
                  THÔNG TIN SẢN PHẨM
                </button>
                <button className="btn buy" onClick={() => handleBuyNow(mac)}>
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

export default MacPage;
