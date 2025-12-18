import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import OrderSVG from "../../assets/svgs/navbar/order.svg";
import SaveSVG from "../../assets/svgs/navbar/cart.svg";
import AccountSVG from "../../assets/svgs/navbar/account.svg";
import LoginSVG from "../../assets/svgs/navbar/login.svg";

const Navbar = () => {
  const navigate = useNavigate();
  const menuItems = [
    "Mac",
    "iPad",
    "iPhone",
    "Watch",
    "AirPods",
    "Giải trí",
    "Phụ kiện",
    "Hỗ trợ",
  ];

  const disabledMenus = ["AirPods", "Giải trí", "Phụ kiện", "Hỗ trợ"];

  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCartItems, setHasCartItems] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Kiểm tra login từ localStorage
  useEffect(() => {
    const checkLoginAndCart = async () => {
      const clientStr = localStorage.getItem("client");

      if (!clientStr) {
        setIsLoggedIn(false);
        setHasCartItems(false);
        return;
      }

      const client = JSON.parse(clientStr);
      setIsLoggedIn(true);

      try {
        const res = await fetch(`http://localhost:5000/cart/${client.id}`);
        const data = await res.json();
        setHasCartItems(Array.isArray(data) && data.length > 0);
        setCartCount(data.length);
      } catch (err) {
        console.error("Lỗi kiểm tra giỏ hàng", err);
        setHasCartItems(false);
      }
    };

    checkLoginAndCart();

    window.addEventListener("cart-updated", checkLoginAndCart);
    window.addEventListener("storage", checkLoginAndCart);

    return () => {
      window.removeEventListener("cart-updated", checkLoginAndCart);
      window.removeEventListener("storage", checkLoginAndCart);
    };
  }, []);

  const toggleBagMenu = () => {
    setIsSubmenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".nav-submenu") && !e.target.closest(".cart")) {
        setIsSubmenuOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleLogin = (e) => {
    e.stopPropagation();
    setIsSubmenuOpen(false);

    setTimeout(() => {
      navigate("/login");
    }, 300);
  };

  const handleLogout = () => {
    localStorage.removeItem("client");
    setIsLoggedIn(false);
    setIsSubmenuOpen(false);
    setHasCartItems(false);
    navigate("/");
  };

  const handleAccount = (e) => {
    e.stopPropagation();
    setIsSubmenuOpen(false);

    setTimeout(() => {
      navigate("/account");
    }, 300);
  };

  const handleCart = (e) => {
    e.stopPropagation();
    setIsSubmenuOpen(false);

    setTimeout(() => {
      navigate("/cart");
    }, 300);
  };

  const handleBill = (e) => {
    e.stopPropagation();
    setIsSubmenuOpen(false);

    setTimeout(() => {
      navigate("/bill");
    }, 300);
  };

  return (
    <>
      <nav className="navbar">
        {/* Navbar */}
        <ul className="navbar-menu">
          {/* Logo Apple */}
          <li className="navbar-item logo">
            <a href="/">
              <svg
                viewBox="0 0 14 44"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m13.0729 17.6825a3.61 3.61 0 0 0 -1.7248 3.0365 3.5132 3.5132 0 0 0 2.1379 3.2223 8.394 8.394 0 0 1 -1.0948 2.2618c-.6816.9812-1.3943 1.9623-2.4787 1.9623s-1.3633-.63-2.613-.63c-1.2187 0-1.6525.6507-2.644.6507s-1.6834-.9089-2.4787-2.0243a9.7842 9.7842 0 0 1 -1.6628-5.2776c0-3.0984 2.014-4.7405 3.9969-4.7405 1.0535 0 1.9314.6919 2.5924.6919.63 0 1.6112-.7333 2.8092-.7333a3.7579 3.7579 0 0 1 3.1604 1.5802zm-3.7284-2.8918a3.5615 3.5615 0 0 0 .8469-2.22 1.5353 1.5353 0 0 0 -.031-.32 3.5686 3.5686 0 0 0 -2.3445 1.2084 3.4629 3.4629 0 0 0 -.8779 2.1585 1.419 1.419 0 0 0 .031.2892 1.19 1.19 0 0 0 .2169.0207 3.0935 3.0935 0 0 0 2.1586-1.1368z"></path>
              </svg>
            </a>
          </li>

          {/* Menu items */}
          {menuItems.map((item, index) => {
            const isDisabled = disabledMenus.includes(item);

            return (
              <li
                key={index}
                className={`navbar-item ${isDisabled ? "disabled" : ""}`}
              >
                <a className="navbar-link">{item}</a>
                {isDisabled && (
                  <span className="navbar-tooltip">
                    Nội dung đang cập nhật, vui lòng đợi chúng tôi hoàn thành
                  </span>
                )}
              </li>
            );
          })}

          {/* Cart icon */}
          <li
            className="navbar-item cart"
            onClick={toggleBagMenu}
            style={{ position: "relative" }}
          >
            <a>
              <svg viewBox="0 0 14 44" xmlns="http://www.w3.org/2000/svg">
                <path d="m11.3535 16.0283h-1.0205a3.4229 3.4229 0 0 0 -3.333-2.9648 3.4229 3.4229 0 0 0 -3.333 2.9648h-1.02a2.1184 2.1184 0 0 0 -2.117 2.1162v7.7155a2.1186 2.1186 0 0 0 2.1162 2.1167h8.707a2.1186 2.1186 0 0 0 2.1168-2.1167v-7.7155a2.1184 2.1184 0 0 0 -2.1165-2.1162zm-4.3535-1.8652a2.3169 2.3169 0 0 1 2.2222 1.8652h-4.4444a2.3169 2.3169 0 0 1 2.2222-1.8652zm5.37 11.6969a1.0182 1.0182 0 0 1 -1.0166 1.0171h-8.7069a1.0182 1.0182 0 0 1 -1.0165-1.0171v-7.7155a1.0178 1.0178 0 0 1 1.0166-1.0166h8.707a1.0178 1.0178 0 0 1 1.0164 1.0166z"></path>
              </svg>

              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </a>
          </li>
        </ul>

        {/* Submenu */}
        <div className={`nav-submenu ${isSubmenuOpen ? "active" : ""}`}>
          <div className="submenu-heading">Hồ sơ của tôi</div>
          <div className="submenu-content">
            {isLoggedIn ? (
              <>
                <div className="submenu-group" onClick={handleBill}>
                  <img src={OrderSVG} className="submenu-icon" alt="Đơn hàng" />
                  <div className="submenu-text">
                    <p className="submenu-title">Đơn hàng</p>
                  </div>
                </div>

                <div
                  className={`submenu-group ${!hasCartItems ? "disabled" : ""}`}
                  onClick={hasCartItems ? handleCart : undefined}
                >
                  <img
                    src={SaveSVG}
                    className="submenu-icon icon-cart"
                    alt="Giỏ hàng"
                  />
                  <div className="submenu-text">
                    {!hasCartItems ? (
                      <p className="submenu-title">Giỏ hàng trống</p>
                    ) : (
                      <span className="submenu-title">Giỏ hàng</span>
                    )}
                  </div>
                </div>

                <div className="submenu-group" onClick={handleAccount}>
                  <img
                    src={AccountSVG}
                    className="submenu-icon"
                    alt="Tài khoản"
                  />
                  <p className="submenu-title">Tài khoản</p>
                </div>

                <div className="submenu-group" onClick={handleLogout}>
                  <img
                    src={LoginSVG}
                    className="submenu-icon"
                    alt="Đăng nhập"
                  />
                  <p className="submenu-title">Đăng xuất</p>
                </div>
              </>
            ) : (
              <>
                <div className="submenu-group" onClick={handleLogin}>
                  <img
                    src={LoginSVG}
                    className="submenu-icon"
                    alt="Đăng nhập"
                  />
                  <p className="submenu-title">Đăng nhập</p>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <div
        className={`nav-blur-overlay ${isSubmenuOpen ? "active" : ""}`}
      ></div>
    </>
  );
};

export default Navbar;
