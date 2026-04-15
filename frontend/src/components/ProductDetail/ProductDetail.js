import React, { useEffect, useState } from "react";
import "./ProductDetail.css";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { resolveProductImage } from "../../utils/image";
import RelatedProducts from "../Product/RelatedProducts";
import { logBehavior, ACTION_TYPES } from "../../utils/logger";

function ProductDetail({ apiEndpoint, productType, relatedType, buyRoute }) {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const decodedName = decodeURIComponent(name);

  const [product, setProduct] = useState(null);
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

  /* ===== FETCH PRODUCT INFO (Đã tối ưu) ===== */
  useEffect(() => {
    setFadeout(false);
    setProduct(null);

    fetch(
      `${process.env.REACT_APP_API_URL}/${apiEndpoint}/buy/${encodeURIComponent(decodedName)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.length === 0) return;

        const colors = [];
        const prices = [];
        const colorMap = {};

        data.forEach((p) => {
          prices.push(p.price);

          const safeCode = p.code || "#FFFFFF";
          colorMap[safeCode] = p.image;

          if (!colors.find((c) => c.code === safeCode)) {
            colors.push({ code: safeCode });
          }
        });

        setProduct({
          name: decodedName,
          prices,
          colors,
          colorMap,
        });

        const preSelectedColor = location.state?.preSelectedColor;
        const isColorValid =
          preSelectedColor && colors.some((c) => c.code === preSelectedColor);

        setActiveColor(isColorValid ? preSelectedColor : colors[0].code);
      })
      .catch((err) => console.error("Lỗi fetch chi tiết:", err));
  }, [decodedName, apiEndpoint, location.state]);

  /* ===== FETCH DETAIL TEXT ===== */
  useEffect(() => {
    fetch(
      `${process.env.REACT_APP_API_URL}/details/${encodeURIComponent(decodedName)}`,
    )
      .then((res) => res.json())
      .then(setDetails)
      .catch((err) => console.error("Lỗi fetch đoạn văn detail:", err));
  }, [decodedName]);

  /* ===== HANDLE IMAGE GALLERY ===== */
  useEffect(() => {
    if (!product || !activeColor) return;

    const baseImage = resolveProductImage(
      product.name,
      product.colorMap[activeColor],
      productType,
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
  }, [product, activeColor, productType]);

  if (!product) return null;

  const minPrice = Math.min(...product.prices);
  const maxPrice = Math.max(...product.prices);

  const baseImage = resolveProductImage(
    product.name,
    product.colorMap[activeColor],
    productType,
  );
  const hasGallery = baseImage.startsWith("/assets/images/") && totalImages > 1;
  const currentImage = hasGallery
    ? baseImage.replace(/\/(\d+)\.(png|jpe?g|webp)$/i, `/${imageIndex}.$2`)
    : baseImage;

  const handleBuy = () => {
    logBehavior(ACTION_TYPES.CLICK, `Bấm mua ngay: ${product.name}`);
    const client = localStorage.getItem("client");

    const payloadState = {
      product_name: product.name,
      product_type: productType,
    };

    if (!client) {
      navigate("/login", {
        state: { redirectTo: buyRoute, payload: payloadState },
      });
      return;
    }

    navigate(buyRoute, { state: payloadState });
  };

  const nextImage = () => setImageIndex((i) => (i >= totalImages ? 1 : i + 1));
  const prevImage = () => setImageIndex((i) => (i <= 1 ? totalImages : i - 1));

  const handleBack = (e) => {
    e.preventDefault();
    setFadeout(true);
    setTimeout(() => {
      navigate(-1);
    }, 300);
  };

  return (
    <div className={`product-detail-page ${fadeout ? "fade-out" : ""}`}>
      <div className={`product-detail-overlay`}>
        <div className="product-detail-modal">
          <button className="close-btn" onClick={handleBack}>
            ✕
          </button>

          <div className="detail-left">
            {hasGallery && (
              <button className="nav-btn left" onClick={prevImage}>
                <FaChevronLeft />
              </button>
            )}

            <img
              className="detail-image"
              src={currentImage}
              alt={product.name}
            />

            {hasGallery && (
              <button className="nav-btn right" onClick={nextImage}>
                <FaChevronRight />
              </button>
            )}

            <div className="detail-dots">
              {product.colors.length > 1 &&
                product.colors.map((c) => (
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

          <div className="detail-right">
            <span className="badge-new">MỚI</span>
            <h1>{product.name}</h1>

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
        <RelatedProducts type={relatedType} currentName={product.name} />
      </div>
    </div>
  );
}

export default ProductDetail;
