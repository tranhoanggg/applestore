import React, { useEffect, useState } from "react";
import "./IpadPage.css";
import { useNavigate } from "react-router-dom";

function IpadPage() {
  const navigate = useNavigate();
  const [ipads, setIpads] = useState([]);
  const [activeColors, setActiveColors] = useState({});
  const [pageVisible, setPageVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setPageVisible(true);
    });
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/ipads")
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
        setIpads(Object.values(grouped));
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

  const handleBuyNow = (ipad) => {
    const client = localStorage.getItem("client");

    if (!client) {
      navigate("/login", {
        state: {
          redirectTo: "/buyIpad",
          payload: {
            product_name: ipad.name,
            product_type: "Ipad",
          },
        },
      });
      return;
    }

    navigate("/buyIpad", {
      state: {
        product_name: ipad.name,
        product_type: "Ipad",
      },
    });
  };

  return (
    <section
      className={`ipadpage-container ${
        pageVisible ? "page-enter-active" : "page-enter"
      }`}
    >
      <h2 className="ipadpage-title">Lựa chọn chiếc iPad của bạn</h2>

      <div className="ipadpage-grid">
        {ipads.map((ipad) => {
          const minPrice = Math.min(...ipad.prices);
          const maxPrice = Math.max(...ipad.prices);
          const activeColor = activeColors[ipad.name];

          return (
            <article key={ipad.name} className="ipadpage-card">
              {ipad.hasNew && (
                <img
                  className="ipadpage-badge"
                  src={require("../../assets/images/hot.png")}
                  alt="New"
                />
              )}

              <h3 className="ipadpage-name">{ipad.name}</h3>

              <div className="ipadpage-image">
                <img
                  src={`/assets/images/Ipad/${ipad.name
                    .toLowerCase()
                    .replace(/\s+/g, "")}/${ipad.colorMap[activeColor]}/1.png`}
                  alt={ipad.name}
                />
              </div>

              {/* COLOR DOT */}
              <div className="ipadpage-colors">
                {ipad.colors.map((c) => (
                  <span
                    key={c.code}
                    className={
                      "color-dot" + (activeColor === c.code ? " active" : "")
                    }
                    style={{ backgroundColor: c.code }}
                    onClick={() => handleColorSelect(ipad.name, c.code)}
                  />
                ))}
              </div>

              <p className="ipadpage-price">
                Từ <b>{formatMoney(minPrice)}</b> –{" "}
                <b>{formatMoney(maxPrice)}</b>
              </p>

              <div className="ipadpage-actions">
                <button
                  className="btn info"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/ipad/${ipad.name}`);
                  }}
                >
                  THÔNG TIN SẢN PHẨM
                </button>
                <button className="btn buy" onClick={() => handleBuyNow(ipad)}>
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

export default IpadPage;
