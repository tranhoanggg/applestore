import React, { useEffect, useState, useRef } from "react";
import "./IphoneList.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function IphoneList() {
  const navigate = useNavigate();
  const [iphones, setPhones] = useState([]);
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
    fetch("http://localhost:5000/iphones")
      .then((res) => res.json())
      .then((data) => {
        // === 1. Gom nhóm theo name ===
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

        setPhones(Object.values(grouped));
      })
      .catch((err) => console.error(err));
  }, []);

  const formatMoney = (price) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const handleColorSelect = (iphoneName, color) => {
    setActiveColors((prev) => ({
      ...prev,
      [iphoneName]: color,
    }));
  };

  // compute itemWidth based on viewport and gap
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

  // once iphones + itemWidth ready, initialize offsetIndex to middle copy
  useEffect(() => {
    if (iphones.length === 0) return;
    // start at middle copy: iphones.length (first element of 2nd copy)
    setIsAnimating(false); // no anim for initial positioning
    setOffsetIndex(iphones.length);
    // re-enable animation next tick
    const id = setTimeout(() => setIsAnimating(true), 20);
    return () => clearTimeout(id);
  }, [iphones.length, itemWidth]);

  // extended array (3 copies)
  const extended = [...iphones, ...iphones, ...iphones];
  const extendedCount = extended.length;
  const step = itemWidth + gap;

  // next / prev circular by changing offsetIndex
  const next = () => {
    if (iphones.length === 0) return;
    setIsAnimating(true);
    setOffsetIndex((s) => s + 1);
  };
  const prev = () => {
    if (iphones.length === 0) return;
    setIsAnimating(true);
    setOffsetIndex((s) => s - 1);
  };

  // when transition ends, if we are out of middle copy range, jump back (no animation)
  const onTrackTransitionEnd = () => {
    if (iphones.length === 0) return;
    // if offsetIndex moved beyond middle copies, normalize it
    if (offsetIndex >= iphones.length * 2) {
      // moved too far right -> jump back by one iphones.length
      setIsAnimating(false);
      setOffsetIndex((s) => s - iphones.length);
      // re-enable animation after DOM update
      setTimeout(() => setIsAnimating(true), 20);
    } else if (offsetIndex < iphones.length) {
      // moved too far left -> jump forward by iphones.length
      setIsAnimating(false);
      setOffsetIndex((s) => s + iphones.length);
      setTimeout(() => setIsAnimating(true), 20);
    }
  };

  // track inline style
  const trackStyle = {
    width: `${extendedCount * step}px`,
    transform: `translateX(-${offsetIndex * step}px)`,
    transition: isAnimating
      ? "transform 0.45s cubic-bezier(.22,.9,.18,1)"
      : "none",
  };

  let accumulatedDeltaX = 0; // biến ngoài scope, không phải state

  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return; // chỉ quan tâm scroll ngang
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

    // reset scrollLock sau 400ms
    if (!scrollLock) {
      setTimeout(() => {
        accumulatedDeltaX = 0;
        setScrollLock(false);
      }, 400);
    }
  };

  const handleBuyNow = (iphone) => {
    const client = localStorage.getItem("client");

    if (!client) {
      // chưa đăng nhập → chuyển sang login
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

    // đã đăng nhập → mua ngay
    navigate("/buyPhone", {
      state: {
        product_name: iphone.name,
        product_type: "Iphone",
      },
    });
  };

  return (
    <section className="iphonelist-container">
      <h2 className="iphonelist-title">Mọi phiên bản iPhone</h2>

      <button
        className="iphonelist arrow prev"
        onClick={prev}
        aria-label="Prev"
      >
        <FaChevronLeft />
      </button>
      <button
        className="iphonelist arrow next"
        onClick={next}
        aria-label="Next"
      >
        <FaChevronRight />
      </button>

      <div
        className="iphone-slider-viewport"
        ref={viewportRef}
        onWheel={handleWheel}
      >
        <div
          className="iphone-track"
          ref={trackRef}
          style={trackStyle}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {extended.map((iphone, idx) => {
            const minPrice = Math.min(...iphone.prices);
            const maxPrice = Math.max(...iphone.prices);

            // if iphones empty, render empty slot
            if (!iphone)
              return (
                <div
                  key={`empty-${idx}`}
                  className="iphone-card iphone-card--empty"
                  style={{ width: itemWidth }}
                />
              );
            return (
              <article
                key={`${iphone.ID}-${idx}`}
                className="iphone-card"
                style={{ width: `${itemWidth}px`, minWidth: `${itemWidth}px` }}
              >
                {iphone.hasNew && (
                  <img
                    className="iphone-poster-attach"
                    alt="Hot Iphone"
                    src={require(`../../assets/images/hot.png`)}
                  />
                )}
                <div className="poster-wrapper">
                  {/* Name */}
                  <h3 className="iphone-name" title={iphone.name}>
                    {iphone.name}
                  </h3>

                  {/* Image */}
                  <div className="iphone-poster">
                    <img
                      className="iphone-poster-img"
                      alt={iphone.name}
                      src={`/assets/images/Iphone/${iphone.name
                        .toLowerCase()
                        .replace(/\s+/g, "")}/${
                        iphone.colorMap[activeColors[iphone.name]]
                      }/1.png`}
                    />
                  </div>

                  {/* COLOR DOTS */}
                  <div className="color-dot-group">
                    {iphone.colors.map((c, index) => (
                      <div
                        key={index}
                        className={
                          "color-dot" +
                          (activeColors[iphone.name] === c.code
                            ? " active"
                            : "")
                        }
                        style={{ backgroundColor: c.code }}
                        onClick={() => handleColorSelect(iphone.name, c.code)}
                      ></div>
                    ))}
                  </div>

                  {/* PRICE RANGE */}
                  <p className="iphone-price">
                    Giá chỉ từ <b>{formatMoney(minPrice)}</b> đến{" "}
                    <b>{formatMoney(maxPrice)}</b>
                  </p>

                  {/* Button buy */}
                  <div className="iphonelist-btn-container">
                    <button className="iphonelist btn information">
                      <span className="more-text">THÔNG TIN SẢN PHẨM</span>
                    </button>

                    <button
                      className="iphonelist btn buy"
                      onClick={() => handleBuyNow(iphone)}
                    >
                      <span className="buy-text">MUA NGAY</span>
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

export default IphoneList;
