import React, { useEffect, useState } from "react";
import "./CategoryPage.css";
import { useNavigate } from "react-router-dom";
import { resolveProductImage } from "../../utils/image";

function CategoryPage({
  title,
  apiEndpoint,
  productType,
  itemRoutePrefix,
  buyRoute,
}) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [activeColors, setActiveColors] = useState({});
  const [pageVisible, setPageVisible] = useState(false);

  // Hiệu ứng fade-in khi mount
  useEffect(() => {
    requestAnimationFrame(() => {
      setPageVisible(true);
    });
  }, []);

  // Fetch và format dữ liệu
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
              name,
              products: [],
              colors: [],
              prices: [],
              hasNew: false,
              colorMap: {},
            };
          }

          grouped[name].products.push(item);

          if (!grouped[name].colors.some((c) => c.code === item.code)) {
            grouped[name].colors.push({
              code: item.code,
              folder: item.image,
            });
          }

          grouped[name].colorMap[item.code] = item.image;
          grouped[name].prices.push(item.price);

          if (item.tag === "new") grouped[name].hasNew = true;
        });

        Object.values(grouped).forEach((p) => {
          initialActive[p.name] = p.colors[0]?.code;
        });

        setActiveColors(initialActive);
        setProducts(Object.values(grouped));
      })
      .catch(console.error);
  }, [apiEndpoint]);

  const formatMoney = (price) => price.toLocaleString("vi-VN") + "đ";

  const handleColorSelect = (name, color) => {
    setActiveColors((prev) => ({
      ...prev,
      [name]: color,
    }));
  };

  const handleBuyNow = (product) => {
    const client = localStorage.getItem("client");

    if (!client) {
      navigate("/login", {
        state: {
          redirectTo: buyRoute,
          payload: {
            product_name: product.name,
            product_type: productType,
          },
        },
      });
      return;
    }

    navigate(buyRoute, {
      state: {
        product_name: product.name,
        product_type: productType,
      },
    });
  };

  return (
    <section
      className={`category-page-container ${
        pageVisible ? "page-enter-active" : "page-enter"
      }`}
    >
      <h2 className="category-page-title">{title}</h2>

      <div className="category-page-grid">
        {products.map((product) => {
          const minPrice = Math.min(...product.prices);
          const maxPrice = Math.max(...product.prices);
          const activeColor = activeColors[product.name];

          return (
            <article
              key={product.name}
              className="category-page-card"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                navigate(`/${itemRoutePrefix}/${product.name}`);
              }}
            >
              {product.hasNew && (
                <img
                  className="category-page-badge"
                  src={require("../../assets/images/hot.png")}
                  alt="New"
                />
              )}

              <h3 className="category-page-name">{product.name}</h3>

              <div className="category-page-image">
                <img
                  src={resolveProductImage(
                    product.name,
                    product.colorMap[activeColor],
                    productType,
                  )}
                  alt={product.name}
                />
              </div>

              {/* COLOR DOT */}
              <div className="category-page-colors">
                {product.colors.map((c) => (
                  <span
                    key={c.code}
                    className={
                      "color-dot" + (activeColor === c.code ? " active" : "")
                    }
                    style={{ backgroundColor: c.code }}
                    onClick={(e) => {
                      e.stopPropagation(); // Ngăn click nhầm vào card
                      handleColorSelect(product.name, c.code);
                    }}
                  />
                ))}
              </div>

              <p className="category-page-price">
                Từ <b>{formatMoney(minPrice)}</b> –{" "}
                <b>{formatMoney(maxPrice)}</b>
              </p>

              <div className="category-page-actions">
                <button
                  className="btn info"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    navigate(`/${itemRoutePrefix}/${product.name}`);
                  }}
                >
                  THÔNG TIN SẢN PHẨM
                </button>
                <button
                  className="btn buy"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleBuyNow(product);
                  }}
                >
                  MUA NGAY
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default CategoryPage;
