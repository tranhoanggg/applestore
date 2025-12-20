import React, { useEffect, useState } from "react";
import "./IphoneDetail.css";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { resolveProductImage } from "../../utils/image";

function IphoneDetail() {
  const { name } = useParams();
  const navigate = useNavigate();

  const decodedName = decodeURIComponent(name);

  const [iphone, setIphone] = useState(null);
  const [details, setDetails] = useState([]);
  const [activeColor, setActiveColor] = useState("");
  const [imageIndex, setImageIndex] = useState(1);
  const [totalImages, setTotalImages] = useState(1);
  const [fadeout, setFadeout] = useState(false);

  /* ===== fetch iphone info ===== */
  useEffect(() => {
    fetch("http://localhost:5000/iphones")
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

        setIphone({
          name: decodedName,
          prices,
          colors,
          colorMap,
        });

        setActiveColor(colors[0].code);
      });
  }, [decodedName]);

  /* ===== fetch detail text ===== */
  useEffect(() => {
    fetch(`http://localhost:5000/details/${encodeURIComponent(decodedName)}`)
      .then((res) => res.json())
      .then(setDetails)
      .catch(console.error);
  }, [decodedName]);

  useEffect(() => {
    if (!iphone || !activeColor) return;

    const baseImage = resolveProductImage(iphone.name, iphone.colorMap[activeColor], "Iphone");

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
  }, [iphone, activeColor]);

  if (!iphone) return null;

  const minPrice = Math.min(...iphone.prices);
  const maxPrice = Math.max(...iphone.prices);

  const handleBuy = () => {
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

  const baseImage = resolveProductImage(iphone.name, iphone.colorMap[activeColor], "Iphone");
  const hasGallery = baseImage.startsWith("/assets/images/") && totalImages > 1;
  const currentImage = hasGallery
    ? baseImage.replace(/\/(\d+)\.(png|jpe?g|webp)$/i, `/${imageIndex}.$2`)
    : baseImage;

  return (
    <div className={`iphone-detail-overlay ${fadeout ? "fade-out" : ""}`}>
      <div className="iphone-detail-modal">
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

          <img className="detail-image" src={currentImage} alt={iphone.name} />

          {hasGallery && (
            <>
              <button className="nav-btn right" onClick={nextImage}>
                <FaChevronRight />
              </button>
            </>
          )}

          {/* color dots */}
          <div className="detail-dots">
            {iphone.colors.map((c) => (
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

          <h1>{iphone.name}</h1>

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
  );
}

export default IphoneDetail;
