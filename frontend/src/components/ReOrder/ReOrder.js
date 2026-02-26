import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resolveProductImage } from "../../utils/image";
import "./ReOrder.css";

export default function ReOrder() {
  const navigate = useNavigate();
  const { billId } = useParams(); // Lấy ID của đơn cũ cần mua lại/sửa đổi
  const client = JSON.parse(localStorage.getItem("client") || "{}");

  const [pageVisible, setPageVisible] = useState(false);
  const [items, setItems] = useState([]); // Danh sách sản phẩm mua lại
  const [totalPrice, setTotalPrice] = useState(0);

  // Refs cho hiệu ứng cuộn/sticky
  const payBtnRef = useRef(null);
  const transactionRef = useRef(null);
  const finalPayBtnRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isTopPayVisible, setIsTopPayVisible] = useState(true);
  const [isFinalPayVisible, setIsFinalPayVisible] = useState(false);

  // Search local state
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  // Animation xuất hiện trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => setPageVisible(true));
  }, []);

  // ===== OBSERVER (Giữ nguyên logic UI sticky) =====
  useEffect(() => {
    if (!payBtnRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsTopPayVisible(entry.isIntersecting),
      { threshold: 1, rootMargin: "-42px 0px 0px 0px" },
    );
    observer.observe(payBtnRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!finalPayBtnRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFinalPayVisible(entry.isIntersecting),
      { threshold: 0.5, rootMargin: "-42px 0px 0px 0px" },
    );
    observer.observe(finalPayBtnRef.current);
    return () => observer.disconnect();
  }, [filteredItems]);

  useEffect(() => {
    setShowStickyBar(!isTopPayVisible && !isFinalPayVisible);
  }, [isTopPayVisible, isFinalPayVisible]);

  // Form người nhận
  const [receiver, setReceiver] = useState({
    fullname: "",
    phone: "",
    address: "",
    ward: "",
    district: "",
    province: "",
  });

  // ===== FETCH DỮ LIỆU BILL CŨ =====
  useEffect(() => {
    const loadBillData = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/bill-full/${billId}`,
        );
        const data = await res.json();

        if (data && data.bill) {
          // 1. Fill thông tin người nhận từ đơn cũ
          const { bill } = data;
          setReceiver({
            fullname: bill.name || client.name || "",
            phone: bill.phone || client.phone || "",
            address: bill.address_detail || "",
            ward: bill.commune || "",
            district: bill.district || "",
            province: bill.city || "",
          });
        }

        if (data && data.items) {
          // 2. Set danh sách sản phẩm
          const mappedItems = data.items.map((item) => ({
            cartId: `temp-${item.product_id}-${Date.now()}`,
            product: item.product,
            type: item.type,
            quantity: item.quantity,
            originalProductId: item.product_id, // Lưu ID gốc
          }));

          setItems(mappedItems);
          setFilteredItems(mappedItems);
        }
      } catch (err) {
        console.error("Lỗi load bill info", err);
        alert("Không tìm thấy thông tin đơn hàng cũ.");
        navigate("/");
      }
    };

    if (billId) loadBillData();
  }, [billId, client.name, client.phone, navigate]);

  // Tính tổng tiền
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      return sum + (item.product.price || 0) * item.quantity;
    }, 0);
    setTotalPrice(total);
  }, [items]);

  // ===== XỬ LÝ SỐ LƯỢNG (LOCAL STATE ONLY) =====
  const updateQuantity = (targetItem, action) => {
    const newItems = items.map((item) => {
      if (item.cartId === targetItem.cartId) {
        const newQty =
          action === "increase" ? item.quantity + 1 : item.quantity - 1;
        return { ...item, quantity: newQty < 1 ? 1 : newQty };
      }
      return item;
    });
    setItems(newItems);
  };

  const deleteItem = (targetItem) => {
    if (window.confirm("Bạn muốn bỏ sản phẩm này khỏi đơn mua lại?")) {
      const newItems = items.filter(
        (item) => item.cartId !== targetItem.cartId,
      );
      setItems(newItems);
      if (newItems.length === 0) {
        alert("Đơn hàng trống, quay về trang chủ");
        navigate("/");
      }
    }
  };

  // ===== SEARCH LOCALLY =====
  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredItems(items);
      return;
    }
    const key = searchKeyword.toLowerCase();
    const result = items.filter((item) => {
      const { product } = item;
      return (
        product.name?.toLowerCase().includes(key) ||
        product.color?.toLowerCase().includes(key)
      );
    });
    setFilteredItems(result);
  }, [searchKeyword, items]);

  // ===== PAYMENT LOGIC =====
  const [payMethod, setPayMethod] = useState("");
  const [bank, setBank] = useState("Momo");
  const [showQR, setShowQR] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [expired, setExpired] = useState(false);

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

  // Validate Form
  const isFormFilled = useMemo(() => {
    if (!payMethod) return false;
    if (payMethod === "counter") return receiver.fullname && receiver.phone;
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

  // ===== [UPDATED] HÀM TẠO ĐƠN MỚI =====
  const createNewOrder = async ({ payment_method, bank, payment_status }) => {
    const isCash = payment_method === "Thanh toán tại quầy";

    const payload = {
      old_bill_id: billId, // [QUAN TRỌNG] Gửi ID đơn cũ để xoá
      user_id: client.id,
      name: receiver.fullname,
      phone: receiver.phone,
      payment_method,
      bank: bank || "",
      payment_status,

      address_detail: isCash ? "" : receiver.address,
      commune: isCash ? "" : receiver.ward,
      district: isCash ? "" : receiver.district,
      city: isCash ? "" : receiver.province,

      date: new Date().toISOString().slice(0, 10),

      // Map lại đúng format items cho API
      cartItems: items.map((item) => ({
        product_id: item.originalProductId || item.product.id,
        quantity: item.quantity,
        type: item.type,
      })),
    };

    // Gọi API Re-order thay vì cart/pay
    const res = await fetch(`${process.env.REACT_APP_API_URL}/bill/re-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Re-order failed");
    return data;
  };

  const handlePayment = async () => {
    if (payMethod === "counter") {
      if (!window.confirm("Xác nhận thay đổi và thanh toán tại quầy?")) return;
      try {
        await createNewOrder({
          payment_method: "Thanh toán tại quầy",
          payment_status: "Đang chờ thanh toán",
        });
        alert("Mua lại thành công! Đơn cũ đã được thay thế.");
        navigate("/");
      } catch (err) {
        alert("Lỗi khi tạo đơn: " + err.message);
        console.error(err);
      }
    } else if (payMethod === "transfer") {
      setShowQR(true);
    }
  };

  const resetTransfer = () => {
    setShowQR(false);
    setExpired(false);
    setSecondsLeft(600);
  };

  return (
    <div
      className={`reorder-page ${
        pageVisible ? "page-enter-active" : "page-enter"
      }`}
    >
      {/* Sticky Header */}
      {!showQR && (
        <div className={`sticky-reorder ${showStickyBar ? "show" : ""}`}>
          <div className="sticky-left">
            Tổng giá trị đơn hàng:{" "}
            <strong>{totalPrice.toLocaleString()}đ</strong>
          </div>
          <button
            className="sticky-btn"
            onClick={() =>
              transactionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          >
            Thanh toán ngay
          </button>
        </div>
      )}

      <div className="reorder-content">
        <p className="note">Đơn hàng mua lại (Re-order).</p>
        <h1>
          Tổng giá trị: <span>{totalPrice.toLocaleString()}đ</span>
        </h1>
        <button
          ref={payBtnRef}
          className="main-pay-btn"
          onClick={() =>
            transactionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        >
          Tiến hành thanh toán
        </button>
      </div>

      {/* Search Bar */}
      <div className="reorder-search-bar">
        <input
          type="text"
          placeholder="Tìm trong danh sách sản phẩm..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className="reorder-search-icon"
        >
          <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
        </svg>
      </div>

      {/* Product List */}
      <div className="reorder-items-container">
        {filteredItems.map((item) => {
          const { product, quantity, type } = item;
          return (
            <div className="reorder-item" key={item.cartId}>
              <img
                className="reorder-img"
                src={resolveProductImage(product.name, product.image, type)}
                alt={product.name}
              />
              <div className="reorder-info">
                <h3>{product.name}</h3>
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

              {/* Update Quantity Local */}
              <div className="reorder-qty">
                <button onClick={() => updateQuantity(item, "decrease")}>
                  -
                </button>
                <span>{quantity}</span>
                <button onClick={() => updateQuantity(item, "increase")}>
                  +
                </button>
              </div>

              <div className="reorder-price">
                {(product.price * quantity).toLocaleString()}đ
                <button
                  className="reorder-remove"
                  onClick={() => deleteItem(item)}
                >
                  Xoá
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Section */}
      <div className="reorder buy-content" ref={transactionRef}>
        <div className="reorder buy-left">
          <div className="reorder buy-left-title">Thông tin giao dịch</div>
          {showQR && !expired && (
            <div className="reorder qr-section">
              <h3>Quét mã để thanh toán</h3>
              <img
                className="reorder qr-image"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrString}`}
                alt="QR"
                onClick={async () => {
                  try {
                    await createNewOrder({
                      payment_method: "Chuyển khoản",
                      bank: bank,
                      payment_status: "Thành công",
                    });
                    alert("Thanh toán thành công! Đơn cũ đã được thay thế.");
                    navigate("/");
                  } catch (e) {
                    alert("Lỗi thanh toán: " + e.message);
                  }
                }}
              />
              <div className="reorder qr-info">
                <p style={{ marginTop: "24px" }}>Ngân hàng: {bank}</p>
                <p>STK: 121836686868</p>
                <p>Tổng tiền: {totalPrice.toLocaleString()}đ</p>
                <p>Hết hạn sau: {formatTime(secondsLeft)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="reorder buy-right">
          <div className="reorder receiver-form">
            {[
              "fullname",
              "phone",
              "address",
              "ward",
              "district",
              "province",
            ].map((field) => (
              <div className="reorder input-block" key={field}>
                <label>
                  {
                    {
                      fullname: "Họ tên",
                      phone: "SĐT",
                      address: "Số nhà",
                      ward: "Phường/Xã",
                      district: "Quận/Huyện",
                      province: "Tỉnh/TP",
                    }[field]
                  }
                </label>
                <input
                  disabled={
                    showQR ||
                    (payMethod === "counter" &&
                      ["address", "ward", "district", "province"].includes(
                        field,
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
          <h2 className="reorder payment-title">Chọn phương thức thanh toán</h2>
          <div className="reorder payment-methods">
            <label className="reorder radio-item payment-location">
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

            <label className="reorder radio-item">
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
              className="reorder bank-select"
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
            <div className="reorder expired-box">
              <h3>Thanh toán thất bại (hết thời gian).</h3>
              <div className="reorder expired-actions">
                <button className="reorder retry-pay" onClick={resetTransfer}>
                  Tiếp tục thanh toán
                </button>

                <button
                  className="reorder back-home"
                  onClick={() => navigate("/")}
                >
                  Quay về trang chủ
                </button>
              </div>
            </div>
          )}

          {!showQR && (
            <button
              className={`reorder submit-btn ${
                !isFormFilled ? "disabled" : ""
              }`}
              disabled={!isFormFilled}
              onClick={handlePayment}
              ref={finalPayBtnRef}
            >
              Mua lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
