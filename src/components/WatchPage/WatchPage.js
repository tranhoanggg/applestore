import React, { useEffect, useState } from "react";
import "./WatchPage.css";
import { useNavigate } from "react-router-dom";

function WatchPage() {
  const navigate = useNavigate();
  const [watches, setWatches] = useState([]);
  const [activeColors, setActiveColors] = useState({});
  const [pageVisible, setPageVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setPageVisible(true);
    });
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/watchs")
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
        setWatches(Object.values(grouped));
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

  const handleBuyNow = (watch) => {
    const client = localStorage.getItem("client");

    if (!client) {
      navigate("/login", {
        state: {
          redirectTo: "/buyWatch",
          payload: {
            product_name: watch.name,
            product_type: "Watch",
          },
        },
      });
      return;
    }

    navigate("/buyWatch", {
      state: {
        product_name: watch.name,
        product_type: "Watch",
      },
    });
  };

  return (
    <section
      className={`watchpage-container ${
        pageVisible ? "page-enter-active" : "page-enter"
      }`}
    >
      <h2 className="watchpage-title">
        Apple Watch - Thời thượng và tiện dụng
      </h2>

      <div className="watchpage-grid">
        {watches.map((watch) => {
          const minPrice = Math.min(...watch.prices);
          const maxPrice = Math.max(...watch.prices);
          const activeColor = activeColors[watch.name];

          return (
            <article key={watch.name} className="watchpage-card">
              {watch.hasNew && (
                <img
                  className="watchpage-badge"
                  src={require("../../assets/images/hot.png")}
                  alt="New"
                />
              )}

              <h3 className="watchpage-name">{watch.name}</h3>

              <div className="watchpage-image">
                <img
                  src={`/assets/images/Watch/${watch.name
                    .toLowerCase()
                    .replace(/\s+/g, "")}/${watch.colorMap[activeColor]}/1.png`}
                  alt={watch.name}
                />
              </div>

              {/* COLOR DOT */}
              <div className="watchpage-colors">
                {watch.colors.map((c) => (
                  <span
                    key={c.code}
                    className={
                      "color-dot" + (activeColor === c.code ? " active" : "")
                    }
                    style={{ backgroundColor: c.code }}
                    onClick={() => handleColorSelect(watch.name, c.code)}
                  />
                ))}
              </div>

              <p className="watchpage-price">
                Từ <b>{formatMoney(minPrice)}</b> –{" "}
                <b>{formatMoney(maxPrice)}</b>
              </p>

              <div className="watchpage-actions">
                <button
                  className="btn info"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/watch/${watch.name}`);
                  }}
                >
                  THÔNG TIN SẢN PHẨM
                </button>
                <button className="btn buy" onClick={() => handleBuyNow(watch)}>
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

export default WatchPage;
