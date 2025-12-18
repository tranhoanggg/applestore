import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./IpadList.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function IpadList() {
  const navigate = useNavigate();
  const [ipads, setIpads] = useState([]);
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
    fetch("http://localhost:5000/ipads")
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

        setIpads(Object.values(grouped));
      })
      .catch((err) => console.error(err));
  }, []);

  const formatMoney = (price) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const handleColorSelect = (ipadName, color) => {
    setActiveColors((prev) => ({
      ...prev,
      [ipadName]: color,
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
    if (ipads.length === 0) return;

    setIsAnimating(false);
    setOffsetIndex(ipads.length);

    const id = setTimeout(() => setIsAnimating(true), 20);
    return () => clearTimeout(id);
  }, [ipads.length, itemWidth]);

  const extended = [...ipads, ...ipads, ...ipads];
  const extendedCount = extended.length;
  const step = itemWidth + gap;

  const next = () => {
    if (ipads.length === 0) return;
    setIsAnimating(true);
    setOffsetIndex((s) => s + 1);
  };
  const prev = () => {
    if (ipads.length === 0) return;
    setIsAnimating(true);
    setOffsetIndex((s) => s - 1);
  };

  const onTrackTransitionEnd = () => {
    if (ipads.length === 0) return;

    if (offsetIndex >= ipads.length * 2) {
      setIsAnimating(false);
      setOffsetIndex((s) => s - ipads.length);

      setTimeout(() => setIsAnimating(true), 20);
    } else if (offsetIndex < ipads.length) {
      setIsAnimating(false);
      setOffsetIndex((s) => s + ipads.length);
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

  const handleBuyNow = (ipad) => {
    const client = localStorage.getItem("client");

    if (!client) {
      // chưa đăng nhập → chuyển sang login
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

    // đã đăng nhập → mua ngay
    navigate("/buyIpad", {
      state: {
        product_name: ipad.name,
        product_type: "Ipad",
      },
    });
  };

  return (
    <section className="ipadlist-container">
      <h2 className="ipadlist-title">Lựa chọn chiếc iPad của bạn</h2>

      <button className="ipadlist arrow prev" onClick={prev} aria-label="Prev">
        <FaChevronLeft />
      </button>
      <button className="ipadlist arrow next" onClick={next} aria-label="Next">
        <FaChevronRight />
      </button>

      <div
        className="ipad-slider-viewport"
        ref={viewportRef}
        onWheel={handleWheel}
      >
        <div
          className="ipad-track"
          ref={trackRef}
          style={trackStyle}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {extended.map((ipad, idx) => {
            const minPrice = Math.min(...ipad.prices);
            const maxPrice = Math.max(...ipad.prices);

            if (!ipad)
              return (
                <div
                  key={`empty-${idx}`}
                  className="ipad-card ipad-card--empty"
                  style={{ width: itemWidth }}
                />
              );
            return (
              <article
                key={`${ipad.ID}-${idx}`}
                className="ipad-card"
                style={{ width: `${itemWidth}px`, minWidth: `${itemWidth}px` }}
              >
                {ipad.hasNew && (
                  <img
                    className="ipad-poster-attach"
                    alt="Hot Ipad"
                    src={require(`../../assets/images/hot.png`)}
                  />
                )}
                <div className="poster-wrapper">
                  {/* Name */}
                  <h3 className="ipad-name" title={ipad.name}>
                    {ipad.name}
                  </h3>

                  {/* Image */}
                  <div className="ipad-poster">
                    <img
                      className="ipad-poster-img"
                      alt={ipad.name}
                      src={`/assets/images/Ipad/${ipad.name
                        .toLowerCase()
                        .replace(/\s+/g, "")}/${
                        ipad.colorMap[activeColors[ipad.name]]
                      }/1.png`}
                    />
                  </div>

                  {/* COLOR DOTS */}
                  <div className="color-dot-group">
                    {ipad.colors.map((c, index) => (
                      <div
                        key={index}
                        className={
                          "color-dot" +
                          (activeColors[ipad.name] === c.code ? " active" : "")
                        }
                        style={{ backgroundColor: c.code }}
                        onClick={() => handleColorSelect(ipad.name, c.code)}
                      ></div>
                    ))}
                  </div>

                  {/* PRICE RANGE */}
                  <p className="ipad-price">
                    Giá chỉ từ <b>{formatMoney(minPrice)}</b> đến{" "}
                    <b>{formatMoney(maxPrice)}</b>
                  </p>

                  {/* Button buy */}
                  <div className="ipadlist-btn-container">
                    <button className="ipadlist btn information">
                      <span className="more-text">THÔNG TIN SẢN PHẨM</span>
                    </button>

                    <button className="ipadlist btn buy">
                      <span
                        className="buy-text"
                        onClick={() => handleBuyNow(ipad)}
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

export default IpadList;
