import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resolveProductImage } from "../../utils/image";
import "./RelatedProducts.css";

const RelatedProducts = ({ type, currentName }) => {
  const [products, setProducts] = useState([]);

  const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        // Gọi API với currentName đã được encode
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/products/${type}/${encodeURIComponent(
            currentName,
          )}/related`,
        );
        const data = await res.json();

        if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (error) {
        console.error("Lỗi tải sản phẩm gợi ý:", error);
      }
    };

    if (type && currentName) {
      fetchRelated();
    }
  }, [type, currentName]);

  if (products.length === 0) return null;

  return (
    <div className="related-products-container">
      <h3 className="related-title">Có thể bạn cũng thích</h3>
      <div className="related-grid">
        {products.map((item) => (
          <Link
            // Link chuyển hướng theo tên sản phẩm
            to={`/${type}/${encodeURIComponent(item.name)}`}
            key={item.id}
            className="related-card"
            state={{ preSelectedColor: item.code }}
            onClick={() => window.scrollTo(0, 0)}
          >
            <div className="related-image-wrapper">
              <img
                src={resolveProductImage(
                  item.name,
                  item.image,
                  capitalize(type),
                )}
                alt={item.name}
                loading="lazy"
              />
            </div>
            <div className="related-info">
              <h4 className="related-name">{item.name}</h4>
              <p className="related-price">
                {/* Thêm chữ "Từ" vì đây là giá đại diện */}
                Từ {Number(item.price).toLocaleString("vi-VN")}đ
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
