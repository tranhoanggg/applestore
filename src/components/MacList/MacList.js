import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./MacList.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function MacList() {
  const navigate = useNavigate();
  const [macs, setMacs] = useState([]);
  const [offsetIndex, setOffsetIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [activeColors, setActiveColors] = useState({});
  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  const [scrollLock, setScrollLock] = useState(false);
  const scrollThreshold = 100;

  const itemsPerPage = 3;
  const gap = 40;
  const [itemWidth, setItemWidth] = useState(220);

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
              name: name,
              products: [],
              colors: [],
              prices: [],
              hasNew: false,
              colorMap: {},
            };
          }

          grouped[name].products.push(item);
          const colorObj = {
            code: item.code,
            folder: item.image,
          };

          if (!grouped[name].colors.some((c) => c.code === colorObj.code)) {
            grouped[name].colors.push(colorObj);
          }
          grouped[name].colorMap[item.code] = item.image;
          grouped[name].prices.push(item.price);

          if (item.tag === "new") grouped[name].hasNew = true;

          Object.values(grouped).forEach((item) => {
            const firstColor = item.colors[0].code;
            initialActive[item.name] = firstColor;
          });
          setActiveColors(initialActive);
        });

        setMacs(Object.values(grouped));
      })
      .catch((err) => console.error(err));
  }, []);

  const formatMoney = (price) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const handleColorSelect = (macName, color) => {
    setActiveColors((prev) => ({
      ...prev,
      [macName]: color,
    }));
  };

  useEffect(() => {
    function recompute() {
      if (!viewportRef.current) return;
      const w = viewportRef.current.clientWidth;
      const computed = Math.floor(
        (w - gap * (itemsPerPage - 1)) / itemsPerPage
      );
      setItemWidth(computed > 100 ? computed : 120);
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [itemsPerPage]);

  useEffect(() => {
    if (macs.length === 0) return;

    setIsAnimating(false);
    setOffsetIndex(macs.length);

    const id = setTimeout(() => setIsAnimating(true), 20);
    return () => clearTimeout(id);
  }, [macs.length, itemWidth]);

  const extended = [...macs, ...macs, ...macs];
  const extendedCount = extended.length;
  const step = itemWidth + gap;

  const next = () => {
    if (macs.length === 0) return;
    setIsAnimating(true);
    setOffsetIndex((s) => s + 1);
  };
  const prev = () => {
    if (macs.length === 0) return;
    setIsAnimating(true);
    setOffsetIndex((s) => s - 1);
  };

  const onTrackTransitionEnd = () => {
    if (macs.length === 0) return;

    if (offsetIndex >= macs.length * 2) {
      setIsAnimating(false);
      setOffsetIndex((s) => s - macs.length);

      setTimeout(() => setIsAnimating(true), 20);
    } else if (offsetIndex < macs.length) {
      setIsAnimating(false);
      setOffsetIndex((s) => s + macs.length);
      setTimeout(() => setIsAnimating(true), 20);
    }
  };

  const trackStyle = {
    width: `${extendedCount * step}px`,
    transform: `translateX(-${offsetIndex * step}px)`,
    transition: isAnimating
      ? "transform 0.45s cubic-bezier(.22,.9,.18,1)"
      : "none",
  };

  let accumulatedDeltaX = 0;

  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    e.preventDefault();

    if (scrollLock) return;

    accumulatedDeltaX += e.deltaX;

    if (accumulatedDeltaX > scrollThreshold) {
      next();
      setScrollLock(true);
    } else if (accumulatedDeltaX < -scrollThreshold) {
      prev();
      setScrollLock(true);
    }

    if (!scrollLock) {
      setTimeout(() => {
        accumulatedDeltaX = 0;
        setScrollLock(false);
      }, 400);
    }
  };

  const handleBuyNow = (mac) => {
    const client = localStorage.getItem("client");

    if (!client) {
      // chưa đăng nhập → chuyển sang login
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

    // đã đăng nhập → mua ngay
    navigate("/buyMac", {
      state: {
        product_name: mac.name,
        product_type: "Mac",
      },
    });
  };

  return (
    <section className="maclist-container">
      <h2 className="maclist-title">Mac - Người bạn đồng hành tin cậy</h2>

      <button className="maclist arrow prev" onClick={prev} aria-label="Prev">
        <FaChevronLeft />
      </button>
      <button className="maclist arrow next" onClick={next} aria-label="Next">
        <FaChevronRight />
      </button>

      <div
        className="mac-slider-viewport"
        ref={viewportRef}
        onWheel={handleWheel}
      >
        <div
          className="mac-track"
          ref={trackRef}
          style={trackStyle}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {extended.map((mac, idx) => {
            const minPrice = Math.min(...mac.prices);
            const maxPrice = Math.max(...mac.prices);

            if (!mac)
              return (
                <div
                  key={`empty-${idx}`}
                  className="mac-card mac-card--empty"
                  style={{ width: itemWidth }}
                />
              );
            return (
              <article
                key={`${mac.ID}-${idx}`}
                className="mac-card"
                style={{ width: `${itemWidth}px`, minWidth: `${itemWidth}px` }}
              >
                {mac.hasNew && (
                  <img
                    className="mac-poster-attach"
                    alt="Hot Mac"
                    src={require(`../../assets/images/hot.png`)}
                  />
                )}
                <div className="poster-wrapper">
                  {/* Name */}
                  <h3 className="mac-name" title={mac.name}>
                    {mac.name}
                  </h3>

                  {/* Image */}
                  <div className="mac-poster">
                    <img
                      className="mac-poster-img"
                      alt={mac.name}
                      src={`/assets/images/mac/${mac.name
                        .toLowerCase()
                        .replace(/\s+/g, "")}/${
                        mac.colorMap[activeColors[mac.name]]
                      }/1.png`}
                    />
                  </div>

                  {/* COLOR DOTS */}
                  <div className="color-dot-group">
                    {mac.colors.map((c, index) => (
                      <div
                        key={index}
                        className={
                          "color-dot" +
                          (activeColors[mac.name] === c.code ? " active" : "")
                        }
                        style={{ backgroundColor: c.code }}
                        onClick={() => handleColorSelect(mac.name, c.code)}
                      ></div>
                    ))}
                  </div>

                  {/* PRICE RANGE */}
                  <p className="mac-price">
                    Giá chỉ từ <b>{formatMoney(minPrice)}</b> đến{" "}
                    <b>{formatMoney(maxPrice)}</b>
                  </p>

                  {/* Button buy */}
                  <div className="maclist-btn-container">
                    <button className="maclist btn information">
                      <span className="more-text">THÔNG TIN SẢN PHẨM</span>
                    </button>

                    <button className="maclist btn buy">
                      <span
                        className="buy-text"
                        onClick={() => handleBuyNow(mac)}
                      >
                        MUA NGAY
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default MacList;
