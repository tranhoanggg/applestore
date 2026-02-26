import React, { useEffect, useState } from "react";
import "./IpadDetail.css";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { resolveProductImage } from "../../utils/image";
import RelatedProducts from "../Product/RelatedProducts";
import { logBehavior, ACTION_TYPES } from "../../utils/logger";

function IpadDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const decodedName = decodeURIComponent(name);

  const [ipad, setIpad] = useState(null);
  const [details, setDetails] = useState([]);
  const [activeColor, setActiveColor] = useState("");
  const [imageIndex, setImageIndex] = useState(1);
  const [totalImages, setTotalImages] = useState(1);
  const [fadeout, setFadeout] = useState(false);

  useEffect(() => {
    if (name) {
      logBehavior(
        ACTION_TYPES.VIEW,
        `Xem chi tiết: ${decodeURIComponent(name)}`,
      );
    }
  }, [name]);

  /* ===== fetch ipad info ===== */
  useEffect(() => {
    setFadeout(false);
    setIpad(null);

    fetch(`${process.env.REACT_APP_API_URL}/ipads`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((p) => p.name.trim() === decodedName);

        if (!filtered.length) return;

        const colors = [];
        const prices = [];
        const colorMap = {};

        filtered.forEach((p) => {
          prices.push(p.price);
          colorMap[p.code] = p.image;

          if (!colors.find((c) => c.code === p.code)) {
            colors.push({ code: p.code });
          }
        });

        setIpad({
          name: decodedName,
          prices,
          colors,
          colorMap,
        });

        const preSelectedColor = location.state?.preSelectedColor;

        // Kiểm tra xem màu truyền vào có tồn tại trong danh sách màu của sp này không
        const isColorValid =
          preSelectedColor && colors.some((c) => c.code === preSelectedColor);

        if (isColorValid) {
          setActiveColor(preSelectedColor); // Dùng màu từ RelatedProducts
        } else {
          setActiveColor(colors[0].code); // Dùng màu mặc định
        }
      });
  }, [decodedName]);

  /* ===== fetch detail text ===== */
  useEffect(() => {
    fetch(
      `${process.env.REACT_APP_API_URL}/details/${encodeURIComponent(decodedName)}`,
    )
      .then((res) => res.json())
      .then(setDetails)
      .catch(console.error);
  }, [decodedName]);

  useEffect(() => {
    if (!ipad || !activeColor) return;

    const baseImage = resolveProductImage(
      ipad.name,
      ipad.colorMap[activeColor],
      "Ipad",
    );

    if (!baseImage.startsWith("/assets/images/")) {
      setTotalImages(1);
      setImageIndex(1);
      return;
    }

    const match = baseImage.match(/\/\d+\.(png|jpe?g|webp)$/i);
    const ext = match?.[1] || "png";
    const basePath = baseImage.replace(/\/\d+\.(png|jpe?g|webp)$/i, "");

    let count = 0;
    let index = 1;

    const checkImage = () => {
      const img = new Image();
      img.src = `${basePath}/${index}.${ext}`;

      img.onload = () => {
        count++;
        index++;
        checkImage();
      };

      img.onerror = () => {
        setTotalImages(count || 1);
        setImageIndex(1);
      };
    };

    checkImage();
  }, [ipad, activeColor]);

  if (!ipad) return null;

  const minPrice = Math.min(...ipad.prices);
  const maxPrice = Math.max(...ipad.prices);
  const baseImage = resolveProductImage(
    ipad.name,
    ipad.colorMap[activeColor],
    "Ipad",
  );
  const hasGallery = baseImage.startsWith("/assets/images/") && totalImages > 1;
  const currentImage = hasGallery
    ? baseImage.replace(/\/(\d+)\.(png|jpe?g|webp)$/i, `/${imageIndex}.$2`)
    : baseImage;

  const handleBuy = () => {
    logBehavior(ACTION_TYPES.CLICK, `Bấm mua ngay: ${ipad.name}`);
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

  const nextImage = () => {
    setImageIndex((i) => (i >= totalImages ? 1 : i + 1));
  };

  const prevImage = () => {
    setImageIndex((i) => (i <= 1 ? totalImages : i - 1));
  };

  const handleBack = (e) => {
    e.preventDefault();
    setFadeout(true);
    setTimeout(() => {
      navigate(-1);
    }, 300);
  };

  return (
    <div className={`ipad-detail-page ${fadeout ? "fade-out" : ""}`}>
      <div className={`ipad-detail-overlay`}>
        <div className="ipad-detail-modal">
          {/* CLOSE */}
          <button className="close-btn" onClick={handleBack}>
            ✕
          </button>

          {/* LEFT */}
          <div className="detail-left">
            {hasGallery && (
              <>
                <button className="nav-btn left" onClick={prevImage}>
                  <FaChevronLeft />
                </button>
              </>
            )}

            <img className="detail-image" src={currentImage} alt={ipad.name} />

            {hasGallery && (
              <>
                <button className="nav-btn right" onClick={nextImage}>
                  <FaChevronRight />
                </button>
              </>
            )}

            {/* color dots */}
            <div className="detail-dots">
              {ipad.colors.map((c) => (
                <span
                  key={c.code}
                  className={
                    "color-dot" + (activeColor === c.code ? " active" : "")
                  }
                  style={{ backgroundColor: c.code }}
                  onClick={() => setActiveColor(c.code)}
                />
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="detail-right">
            <span className="badge-new">MỚI</span>

            <h1>{ipad.name}</h1>

            <div className="price-container">
              <p className="price-range">
                Từ {minPrice.toLocaleString("vi-VN")}đ đến{" "}
                {maxPrice.toLocaleString("vi-VN")}đ
              </p>

              <button className="buy-btn" onClick={handleBuy}>
                Mua
              </button>
            </div>

            <div className="detail-list">
              {details.map((d) => (
                <p key={d.id}>{d.detail}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {ipad && ipad.name && (
          <RelatedProducts type="ipad" currentName={ipad.name} />
        )}
      </div>
    </div>
  );
}

export default IpadDetail;
