import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./CheckoutSummary.css";

export default function CheckoutSummary() {
  const navigate = useNavigate();
  const client = JSON.parse(localStorage.getItem("client") || "{}");
  const [pageVisible, setPageVisible] = useState(false);

  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const payBtnRef = useRef(null);
  const transactionRef = useRef(null);
  const finalPayBtnRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const [isTopPayVisible, setIsTopPayVisible] = useState(true);
  const [isFinalPayVisible, setIsFinalPayVisible] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      setPageVisible(true);
    });
  }, []);

  // ===== OBSERVER =====
  useEffect(() => {
    if (!payBtnRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTopPayVisible(entry.isIntersecting);
      },
      {
        threshold: 1,
        rootMargin: "-42px 0px 0px 0px",
      }
    );

    observer.observe(payBtnRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!finalPayBtnRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFinalPayVisible(entry.isIntersecting);
      },
      {
        threshold: 0.5,
        rootMargin: "-42px 0px 0px 0px",
      }
    );

    observer.observe(finalPayBtnRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setShowStickyBar(!isTopPayVisible && !isFinalPayVisible);
  }, [isTopPayVisible, isFinalPayVisible]);

  const loadCart = async () => {
    try {
      const cartRes = await fetch(`http://localhost:5000/cart/${client.id}`);
      const cartData = await cartRes.json();

      const items = await Promise.all(
        cartData.map(async (item) => {
          const productRes = await fetch(
            `http://localhost:5000/${item.type.toLowerCase()}/${
              item.product_id
            }`
          );
          const productData = await productRes.json();

          return {
            cartId: item.id,
            type: item.type,
            quantity: item.quantity,
            product: productData[0],
          };
        })
      );

      setCartItems(items);
      setFilteredItems(items);
    } catch (err) {
      console.error("Lỗi load cart", err);
    }
  };

  useEffect(() => {
    if (!client?.id) return;

    loadCart();
  }, [client?.id]);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    setTotalPrice(total);
  }, [cartItems]);

  const updateQuantity = async (item, action) => {
    try {
      await fetch("http://localhost:5000/cart/update-quantity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: client.id,
          product_id: item.product.id,
          type: item.type,
          action,
        }),
      });

      loadCart();
    } catch (err) {
      console.error("Lỗi cập nhật số lượng", err);
    }
  };

  const deleteCartItem = async (item) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xoá sản phẩm này khỏi giỏ hàng?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch("http://localhost:5000/cart/delete-item", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: client.id,
          product_id: item.product.id,
          type: item.type,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Không thể xoá sản phẩm");
        return;
      }

      window.dispatchEvent(new Event("cart-updated"));

      // reload cart
      const cartRes = await fetch(`http://localhost:5000/cart/${client.id}`);
      const cartData = await cartRes.json();

      if (!cartData.length) {
        alert("Giỏ hàng của bạn đã hết sản phẩm");
        navigate("/");
        return;
      }

      loadCart();
    } catch (err) {
      console.error("Delete cart item error", err);
      alert("Có lỗi xảy ra khi xoá sản phẩm");
    }
  };

  const [receiver, setReceiver] = useState({
    fullname: client?.name || "",
    phone: client?.phone || "",
    address: "",
    ward: "",
    district: "",
    province: "",
  });

  const [payMethod, setPayMethod] = useState("");
  const [bank, setBank] = useState("Momo");

  const [showQR, setShowQR] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [expired, setExpired] = useState(false);

  // COUNTDOWN
  useEffect(() => {
    if (!showQR || expired) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showQR, expired]);

  const qrString = useMemo(() => bank + "121836686868", [bank]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  const isFormFilled = useMemo(() => {
    if (!payMethod) return false;

    // Thanh toán tại quầy → chỉ cần tên + SĐT
    if (payMethod === "counter") {
      return receiver.fullname && receiver.phone;
    }

    // Chuyển khoản → cần đầy đủ
    if (payMethod === "transfer") {
      return (
        receiver.fullname &&
        receiver.phone &&
        receiver.address &&
        receiver.ward &&
        receiver.district &&
        receiver.province
      );
    }

    return false;
  }, [receiver, payMethod]);

  const checkoutCart = async ({ payment_method, bank, payment_status }) => {
    const isCash = payment_method === "Thanh toán tại quầy";

    const payload = {
      user_id: client.id,
      name: receiver.fullname,
      phone: receiver.phone,
      payment_method,
      bank,
      payment_status,

      address_detail: isCash ? "" : receiver.address,
      commune: isCash ? "" : receiver.ward,
      district: isCash ? "" : receiver.district,
      city: isCash ? "" : receiver.province,

      date: new Date().toISOString().slice(0, 10),

      cartItems: cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        type: item.type,
      })),
    };

    const res = await fetch("http://localhost:5000/cart/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Checkout failed");
    }

    return data; // { success, bill_id }
  };

  const handlePayment = async () => {
    // === THANH TOÁN TẠI QUẦY ===
    if (payMethod === "counter") {
      const confirmPay = window.confirm("Bạn xác nhận thanh toán tại quầy?");
      if (!confirmPay) return;

      try {
        await checkoutCart({
          payment_method: "Thanh toán tại quầy",
          bank: "",
          payment_status: "Đang chờ thanh toán",
        });

        alert("Đã đặt hàng thành công!");
        navigate("/");
      } catch (err) {
        alert("Có lỗi xảy ra khi đặt hàng!");
        console.error(err);
      }

      return;
    }

    // === CHUYỂN KHOẢN ===
    if (payMethod === "transfer") {
      setShowQR(true);
    }
  };

  const resetTransfer = () => {
    setShowQR(false);
    setExpired(false);
    setSecondsLeft(600);
  };

  const filterCartItems = (keyword) => {
    if (!cartItems.length) return;

    const key = keyword.trim().toLowerCase();

    // Nếu search rỗng → trả lại toàn bộ giỏ
    if (!key) {
      setFilteredItems(cartItems);
      return;
    }

    const result = cartItems.filter((item) => {
      const { product, type } = item;

      const searchableFields = [
        product.name,
        product.color,
        product.image,
        product.price?.toString(),
      ];

      // Iphone / Ipad → capacity
      if (type === "Iphone" || type === "Ipad") {
        searchableFields.push(product.capacity);
      }

      // Mac → ram, rom
      if (type === "Mac") {
        searchableFields.push(product.ram, product.rom);
      }

      return searchableFields
        .filter(Boolean)
        .some(
          (field) =>
            field.toString().toLowerCase().includes(key) ||
            field.toString().toLowerCase().includes(key.toLocaleString("vi-VN"))
        );
    });

    setFilteredItems(result);
  };

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredItems(cartItems);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      filterCartItems(searchKeyword);
    }, 1000);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchKeyword, cartItems]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      filterCartItems(searchKeyword);
    }
  };

  const handleSearchClick = () => {
    filterCartItems(searchKeyword);
  };

  return (
    <>
      <div
        className={`checkout-page ${
          pageVisible ? "page-enter-active" : "page-enter"
        }`}
      >
        {/* ===== NAVBAR PHỤ ===== */}
        {!showQR && (
          <div className={`sticky-checkout ${showStickyBar ? "show" : ""}`}>
            <div className="sticky-left">
              Tổng giá trị giỏ hàng của bạn là{" "}
              <strong>{totalPrice.toLocaleString()}đ</strong>
            </div>
            <button
              className="sticky-btn"
              onClick={() => {
                transactionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              Thanh toán
            </button>
          </div>
        )}
        {/* ===== CONTENT ===== */}
        <div className="checkout-content">
          <p className="note">
            Xin lưu ý rằng chúng tôi không chấp nhận đổi trả đối với các đơn
            hàng trực tuyến.
          </p>

          <h1>
            Tổng giá trị giỏ hàng của bạn là{" "}
            <span>{totalPrice.toLocaleString()}đ</span>.
          </h1>

          <p className="sub-note">Vận chuyển miễn phí đối với mọi đơn hàng.</p>

          <button ref={payBtnRef} className="main-pay-btn">
            Thanh toán
          </button>
        </div>

        {/* ===== SEARCH BAR ===== */}
        <div className="checkout-search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm trong giỏ hàng..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            alt="search"
            className="checkout-search-icon "
            onClick={handleSearchClick}
          >
            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
          </svg>
        </div>

        <div className="checkout-items-container">
          {filteredItems.map((item) => {
            const { product, quantity, type } = item;

            return (
              <div className="checkout-item" key={item.cartId}>
                <img
                  className="checkout-img"
                  src={`/assets/images/${type}/${product.name
                    .toLowerCase()
                    .replace(/\s+/g, "")}/${product.image}/1.png`}
                  alt={product.name}
                />

                <div className="checkout-info">
                  <h3>{product.name}</h3>

                  {/* THÔNG TIN THEO TYPE */}
                  <p>Màu sắc: {product.color}</p>

                  {(type === "Iphone" || type === "Ipad") && (
                    <p>Dung lượng: {product.capacity}</p>
                  )}

                  {type === "Mac" && (
                    <p>
                      RAM: {product.ram} – ROM: {product.rom}
                    </p>
                  )}
                </div>

                {/* SỐ LƯỢNG */}
                <div className="checkout-qty">
                  <button onClick={() => updateQuantity(item, "decrease")}>
                    -
                  </button>
                  <span>{quantity}</span>
                  <button onClick={() => updateQuantity(item, "increase")}>
                    +
                  </button>
                </div>

                {/* GIÁ */}
                <div className="checkout-price">
                  {(product.price * quantity).toLocaleString()}đ
                  <button
                    className="checkout-remove"
                    onClick={() => deleteCartItem(item)}
                  >
                    Xoá
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="checkout buy-content" ref={transactionRef}>
          <>
            {/* LEFT IMAGE */}
            <div className="checkout buy-left">
              <div className="checkout buy-left-title">Thông tin giao dịch</div>

              {/* QR PAY */}
              {showQR && !expired && (
                <div className="checkout qr-section">
                  <h3>Quét mã để thanh toán</h3>

                  <img
                    className="checkout qr-image"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrString}`}
                    alt="QR"
                    onClick={async () => {
                      try {
                        await checkoutCart({
                          payment_method: "Chuyển khoản",
                          bank: bank,
                          payment_status: "Thành công",
                        });

                        alert("Thanh toán thành công!");
                        navigate("/");
                      } catch (err) {
                        alert("Thanh toán thất bại!");
                        console.error(err);
                      }
                    }}
                  />

                  <div className="checkout qr-info">
                    <p style={{ marginTop: "24px", marginBottom: "8px" }}>
                      Ngân hàng: {bank}
                    </p>
                    <p style={{ marginBottom: "8px" }}>
                      Số tài khoản: 121836686868
                    </p>
                    <p style={{ marginBottom: "16px" }}>
                      Tổng giá: {totalPrice.toLocaleString()}đ
                    </p>
                    <p>Thời gian hiệu lực: {formatTime(secondsLeft)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT CONTENT */}
            <div className="checkout buy-right">
              {/* RECEIVER INFO */}
              <div className="checkout receiver-form">
                {[
                  "fullname",
                  "phone",
                  "address",
                  "ward",
                  "district",
                  "province",
                ].map((field) => (
                  <div className="checkout input-block" key={field}>
                    <label>
                      {
                        {
                          fullname: "Họ và tên",
                          phone: "Số điện thoại",
                          address: "Số nhà",
                          ward: "Xã/Phường",
                          district: "Huyện/Thị trấn",
                          province: "Tỉnh/Thành phố",
                        }[field]
                      }
                    </label>

                    <input
                      disabled={
                        showQR ||
                        (payMethod === "counter" &&
                          ["address", "ward", "district", "province"].includes(
                            field
                          ))
                      }
                      value={receiver[field]}
                      onChange={(e) =>
                        setReceiver({ ...receiver, [field]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>

              {/* PAYMENT */}
              <h2 className="checkout payment-title">
                Chọn phương thức thanh toán
              </h2>
              <div className="checkout payment-methods">
                <label className="checkout radio-item payment-location">
                  <input
                    type="radio"
                    name="pay"
                    value="counter"
                    disabled={showQR}
                    onChange={(e) => setPayMethod(e.target.value)}
                  />
                  Thanh toán tại quầy: Apple Store số nhà 12, ngõ 18/36
                  <br /> phường Trung Văn, quận Nam Từ Liêm, thành phố Hà Nội
                </label>

                <label className="checkout radio-item">
                  <input
                    type="radio"
                    name="pay"
                    value="transfer"
                    disabled={showQR}
                    onChange={(e) => setPayMethod(e.target.value)}
                  />
                  Thanh toán chuyển khoản
                </label>
              </div>

              {/* BANK SELECT */}
              {payMethod === "transfer" && !showQR && (
                <select
                  className="checkout bank-select"
                  disabled={showQR}
                  onChange={(e) => setBank(e.target.value)}
                >
                  <option>Momo</option>
                  <option>MbBank</option>
                  <option>ViettinBank</option>
                  <option>VietcomBank</option>
                  <option>SacomBank</option>
                  <option>Agribank</option>
                </select>
              )}

              {/* EXPIRED */}
              {expired && (
                <div className="checkout expired-box">
                  <h3>Thanh toán thất bại (hết thời gian).</h3>
                  <div className="checkout expired-actions">
                    <button
                      className="checkout retry-pay"
                      onClick={resetTransfer}
                    >
                      Tiếp tục thanh toán
                    </button>

                    <button
                      className="checkout back-home"
                      onClick={() => navigate("/")}
                    >
                      Quay về trang chủ
                    </button>
                  </div>
                </div>
              )}

              {/* FINAL BUTTON */}
              {!showQR && (
                <button
                  className={`checkout submit-btn ${
                    !isFormFilled ? "disabled" : ""
                  }`}
                  disabled={!isFormFilled}
                  onClick={handlePayment}
                  ref={finalPayBtnRef}
                >
                  Thanh toán
                </button>
              )}
            </div>
          </>
        </div>
      </div>
    </>
  );
}
