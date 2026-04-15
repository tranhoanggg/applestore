import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ProductList.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { resolveProductImage } from "../../utils/image";

const MarqueeName = ({ name }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      // Kiểm tra độ dài thực tế của chữ so với khung
      setIsOverflowing(
        textRef.current.scrollWidth > containerRef.current.clientWidth,
      );
    }
  }, [name]);

  return (
    <div className="product-name-wrapper" ref={containerRef}>
      <div className={`product-name-track ${isOverflowing ? "marquee" : ""}`}>
        {/* Lượt chữ số 1 */}
        <h3 className="product-name" ref={textRef} title={name}>
          {name}
        </h3>

        {/* Lượt chữ số 2 (Bản sao nối đuôi) - Chỉ hiện khi bị tràn khung */}
        {isOverflowing && (
          <h3 className="product-name" title={name} aria-hidden="true">
            {name}
          </h3>
        )}
      </div>
    </div>
  );
};

function ProductList({
  title,
  apiEndpoint,
  productType,
  itemRoutePrefix,
  buyRoute,
}) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [offsetIndex, setOffsetIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [activeColors, setActiveColors] = useState({});
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const accumulatedDeltaX = useRef(0);

  const [scrollLock, setScrollLock] = useState(false);
  const scrollThreshold = 100;

  const itemsPerPage = 3;
  const gap = 40;
  const [itemWidth, setItemWidth] = useState(220);

  // 1. FETCH DỮ LIỆU SẢN PHẨM
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/${apiEndpoint}`)
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

          const colorCode = item.code || "#FFFFFF";
          const colorName = item.color || "Trắng";

          if (!grouped[name].colors.some((c) => c.code === colorCode)) {
            grouped[name].colors.push({ code: colorCode, name: colorName });
          }

          grouped[name].colorMap[colorCode] = item.image;
          grouped[name].prices.push(item.price);

          if (item.tag === "new") grouped[name].hasNew = true;
        });

        Object.values(grouped).forEach((prod) => {
          initialActive[prod.name] = prod.colors[0].code;
        });

        setActiveColors(initialActive);
        setProducts(Object.values(grouped));
      })
      .catch((err) => console.error("Lỗi fetch ProductList:", err));
  }, [apiEndpoint]);

  const formatMoney = (price) => price?.toLocaleString("vi-VN") + "đ";

  const handleColorSelect = (productName, colorCode) => {
    setActiveColors((prev) => ({ ...prev, [productName]: colorCode }));
  };

  // 2. TÍNH TOÁN KÍCH THƯỚC COMPONENT KHI RESIZE
  useEffect(() => {
    function recompute() {
      if (!viewportRef.current) return;
      const w = viewportRef.current.clientWidth;
      const computed = Math.floor(
        (w - gap * (itemsPerPage - 1)) / itemsPerPage,
      );
      setItemWidth(computed > 100 ? computed : 120);
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [itemsPerPage]);

  // 3. LOGIC CAROUSEL (VÒNG LẶP VÔ HẠN)
  useEffect(() => {
    if (products.length === 0) return;
    setIsAnimating(false);
    setOffsetIndex(products.length);
    const id = setTimeout(() => setIsAnimating(true), 20);
    return () => clearTimeout(id);
  }, [products.length, itemWidth]);

  const extended = [...products, ...products, ...products];
  const extendedCount = extended.length;
  const step = itemWidth + gap;

  const next = () => {
    if (products.length === 0) return;
    setIsAnimating(true);
    setOffsetIndex((s) => s + 1);
  };

  const prev = () => {
    if (products.length === 0) return;
    setIsAnimating(true);
    setOffsetIndex((s) => s - 1);
  };

  const onTrackTransitionEnd = () => {
    if (products.length === 0) return;
    if (offsetIndex >= products.length * 2) {
      setIsAnimating(false);
      setOffsetIndex((s) => s - products.length);
      setTimeout(() => setIsAnimating(true), 20);
    } else if (offsetIndex < products.length) {
      setIsAnimating(false);
      setOffsetIndex((s) => s + products.length);
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

  // 4. XỬ LÝ CUỘN CHUỘT
  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    e.preventDefault();

    if (scrollLock) return;

    accumulatedDeltaX.current += e.deltaX;

    if (accumulatedDeltaX.current > scrollThreshold) {
      next();
      setScrollLock(true);
    } else if (accumulatedDeltaX.current < -scrollThreshold) {
      prev();
      setScrollLock(true);
    }

    if (!scrollLock) {
      setTimeout(() => {
        accumulatedDeltaX.current = 0;
        setScrollLock(false);
      }, 400);
    }
  };

  // 5. XỬ LÝ ĐIỀU HƯỚNG MUA HÀNG
  const handleBuyNow = (product) => {
    const client = localStorage.getItem("client");
    const targetState = {
      product_name: product.name,
      product_type: productType,
    };

    if (!client) {
      navigate("/login", {
        state: { redirectTo: buyRoute, payload: targetState },
      });
      return;
    }

    navigate(buyRoute, { state: targetState });
  };

  return (
    <section className="productlist-container">
      <h2 className="productlist-title">{title}</h2>

      {products.length > 3 && (
        <>
          <button
            className="productlist arrow prev"
            onClick={prev}
            aria-label="Prev"
          >
            <FaChevronLeft />
          </button>
          <button
            className="productlist arrow next"
            onClick={next}
            aria-label="Next"
          >
            <FaChevronRight />
          </button>
        </>
      )}

      <div
        className="product-slider-viewport"
        ref={viewportRef}
        onWheel={handleWheel}
      >
        <div
          className="product-track"
          ref={trackRef}
          style={trackStyle}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {extended.map((product, idx) => {
            if (!product) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="product-card"
                  style={{ width: itemWidth }}
                />
              );
            }

            const minPrice = Math.min(...product.prices);
            const currentColorCode = activeColors[product.name];
            const currentImage = product.colorMap[currentColorCode];

            return (
              <article
                key={`${product.name}-${idx}`}
                className="product-card"
                style={{ width: `${itemWidth}px`, minWidth: `${itemWidth}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  navigate(`/${itemRoutePrefix}/${product.name}`);
                }}
              >
                {product.hasNew && (
                  <img
                    className="product-poster-attach"
                    alt="Hot Product"
                    src={require(`../../assets/images/hot.png`)}
                  />
                )}

                <div className="poster-wrapper">
                  <MarqueeName name={product.name} />

                  <div className="product-poster">
                    <img
                      className="product-poster-img"
                      alt={product.name}
                      src={resolveProductImage(
                        product.name,
                        currentImage,
                        productType,
                      )}
                    />
                  </div>

                  <div className="color-dot-group">
                    {product.colors.length > 1 &&
                      product.colors.map((c, i) => (
                        <div
                          key={i}
                          className={
                            "color-dot" +
                            (activeColors[product.name] === c.code
                              ? " active"
                              : "")
                          }
                          style={{ backgroundColor: c.code }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleColorSelect(product.name, c.code);
                          }}
                        ></div>
                      ))}
                  </div>

                  <p className="product-price">
                    Giá từ <b>{formatMoney(minPrice)}</b>
                  </p>

                  <div className="productlist-btn-container">
                    <button className="productlist btn information">
                      <span className="more-text">THÔNG TIN CHI TIẾT</span>
                    </button>
                    <button
                      className="productlist btn buy"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleBuyNow(product);
                      }}
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

export default ProductList;
