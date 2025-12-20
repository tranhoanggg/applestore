import React, { useEffect, useState } from "react";
import "./MacDetail.css";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { resolveProductImage } from "../../utils/image";

function MacDetail() {
  const { name } = useParams();
  const navigate = useNavigate();

  const decodedName = decodeURIComponent(name);

  const [mac, setMac] = useState(null);
  const [details, setDetails] = useState([]);
  const [activeColor, setActiveColor] = useState("");
  const [imageIndex, setImageIndex] = useState(1);
  const [totalImages, setTotalImages] = useState(1);
  const [fadeout, setFadeout] = useState(false);

  /* ===== fetch mac info ===== */
  useEffect(() => {
    fetch("http://localhost:5000/macs")
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

        setMac({
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
    if (!mac || !activeColor) return;

    const baseImage = resolveProductImage(mac.name, mac.colorMap[activeColor], "Mac");

    if (!baseImage.startsWith("/assets/images/")) {
      setTotalImages(1);
      setImageIndex(1);
      return;
    }

    const basePath = baseImage.replace(/\/1\.png$/, "");

    let count = 0;
    let index = 1;

    const checkImage = () => {
      const img = new Image();
      img.src = `${basePath}/${index}.png`;

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
  }, [mac, activeColor]);

  if (!mac) return null;

  const minPrice = Math.min(...mac.prices);
  const maxPrice = Math.max(...mac.prices);

  const baseImage = resolveProductImage(mac.name, mac.colorMap[activeColor], "Mac");
  const hasGallery = baseImage.startsWith("/assets/images/") && totalImages > 1;
  const currentImage = hasGallery
    ? baseImage.replace(/\/1\.png$/, `/${imageIndex}.png`)
    : baseImage;

  const handleBuy = () => {
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
    <div className={`mac-detail-overlay ${fadeout ? "fade-out" : ""}`}>
      <div className="mac-detail-modal">
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

          <img
            className="detail-image"
            src={currentImage}
            alt={mac.name}
          />

          {hasGallery && (
            <>
              <button className="nav-btn right" onClick={nextImage}>
                <FaChevronRight />
              </button>
            </>
          )}

          {/* color dots */}
          <div className="detail-dots">
            {mac.colors.map((c) => (
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

          <h1>{mac.name}</h1>

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

export default MacDetail;
