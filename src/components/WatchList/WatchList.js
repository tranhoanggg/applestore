import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./WatchList.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function WatchList() {
  const navigate = useNavigate();
  const [watchs, setWatchs] = useState([]);
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
    fetch("http://localhost:5000/watchs")
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

        setWatchs(Object.values(grouped));
      })
      .catch((err) => console.error(err));
  }, []);

  const formatMoney = (price) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const handleColorSelect = (watchName, color) => {
    setActiveColors((prev) => ({
      ...prev,
      [watchName]: color,
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
    if (watchs.length === 0) return;

    setIsAnimating(false);
    setOffsetIndex(watchs.length);

    const id = setTimeout(() => setIsAnimating(true), 20);
    return () => clearTimeout(id);
  }, [watchs.length, itemWidth]);

  const extended = [...watchs, ...watchs, ...watchs];
  const extendedCount = extended.length;
  const step = itemWidth + gap;

  const next = () => {
    if (watchs.length === 0) return;
    setIsAnimating(true);
    setOffsetIndex((s) => s + 1);
  };
  const prev = () => {
    if (watchs.length === 0) return;
    setIsAnimating(true);
    setOffsetIndex((s) => s - 1);
  };

  const onTrackTransitionEnd = () => {
    if (watchs.length === 0) return;

    if (offsetIndex >= watchs.length * 2) {
      setIsAnimating(false);
      setOffsetIndex((s) => s - watchs.length);

      setTimeout(() => setIsAnimating(true), 20);
    } else if (offsetIndex < watchs.length) {
      setIsAnimating(false);
      setOffsetIndex((s) => s + watchs.length);
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

  const handleBuyNow = (watch) => {
    const client = localStorage.getItem("client");

    if (!client) {
      // chưa đăng nhập → chuyển sang login
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

    // đã đăng nhập → mua ngay
    navigate("/buyWatch", {
      state: {
        product_name: watch.name,
        product_type: "Watch",
      },
    });
  };

  return (
    <section className="watchlist-container">
      <h2 className="watchlist-title">
        Apple Watch - Thời thượng và tiện dụng
      </h2>

      <button className="watchlist arrow prev" onClick={prev} aria-label="Prev">
        <FaChevronLeft />
      </button>
      <button className="watchlist arrow next" onClick={next} aria-label="Next">
        <FaChevronRight />
      </button>

      <div
        className="watch-slider-viewport"
        ref={viewportRef}
        onWheel={handleWheel}
      >
        <div
          className="watch-track"
          ref={trackRef}
          style={trackStyle}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {extended.map((watch, idx) => {
            const minPrice = Math.min(...watch.prices);
            const maxPrice = Math.max(...watch.prices);

            if (!watch)
              return (
                <div
                  key={`empty-${idx}`}
                  className="watch-card watch-card--empty"
                  style={{ width: itemWidth }}
                />
              );
            return (
              <article
                key={`${watch.ID}-${idx}`}
                className="watch-card"
                style={{ width: `${itemWidth}px`, minWidth: `${itemWidth}px` }}
              >
                {watch.hasNew && (
                  <img
                    className="watch-poster-attach"
                    alt="Hot Watch"
                    src={require(`../../assets/images/hot.png`)}
                  />
                )}
                <div className="poster-wrapper">
                  {/* Name */}
                  <h3 className="watch-name" title={watch.name}>
                    {watch.name}
                  </h3>

                  {/* Image */}
                  <div className="watch-poster">
                    <img
                      className="watch-poster-img"
                      alt={watch.name}
                      src={`/assets/images/watch/${watch.name
                        .toLowerCase()
                        .replace(/\s+/g, "")}/${
                        watch.colorMap[activeColors[watch.name]]
                      }/1.png`}
                    />
                  </div>

                  {/* COLOR DOTS */}
                  <div className="color-dot-group">
                    {watch.colors.map((c, index) => (
                      <div
                        key={index}
                        className={
                          "color-dot" +
                          (activeColors[watch.name] === c.code ? " active" : "")
                        }
                        style={{ backgroundColor: c.code }}
                        onClick={() => handleColorSelect(watch.name, c.code)}
                        alt={watch.color}
                      ></div>
                    ))}
                  </div>

                  {/* PRICE RANGE */}
                  <p className="watch-price">
                    Giá chỉ từ <b>{formatMoney(minPrice)}</b> đến{" "}
                    <b>{formatMoney(maxPrice)}</b>
                  </p>

                  {/* Button buy */}
                  <div className="watchlist-btn-container">
                    <button className="watchlist btn information">
                      <span className="more-text">THÔNG TIN SẢN PHẨM</span>
                    </button>

                    <button className="watchlist btn buy">
                      <span
                        className="buy-text"
                        onClick={() => handleBuyNow(watch)}
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

export default WatchList;
