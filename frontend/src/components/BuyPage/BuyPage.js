import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resolveProductImage } from "../../utils/image";
import "./BuyPage.css";

const BuyPage = ({ apiEndpoint, productType }) => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [variants, setVariants] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedCapacity, setSelectedCapacity] = useState(null); // Cho iPhone, iPad
  const [selectedRam, setSelectedRam] = useState(null); // Cho Mac
  const [selectedRom, setSelectedRom] = useState(null); // Cho Mac
  const [currentProduct, setCurrentProduct] = useState(null);

  // User
  const client = JSON.parse(localStorage.getItem("client") || "{}");

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

  // 1. FETCH SẢN PHẨM & SET MẶC ĐỊNH
  useEffect(() => {
    if (!state?.product_name) return;

    // Sử dụng encodeURIComponent để URL không bị lỗi khi tên sản phẩm có dấu cách/tiếng Việt
    fetch(
      `${process.env.REACT_APP_API_URL}/${apiEndpoint}/buy/${encodeURIComponent(state.product_name)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.length) return;

        // Bọc dữ liệu an toàn để xử lý trường hợp database có color/code là NULL (như AirPods)
        const safeData = data.map((item) => ({
          ...item,
          color: item.color || "Trắng",
          code: item.code || "#FFFFFF",
        }));

        setVariants(safeData);

        const firstColor = safeData[0].color;
        setSelectedColor(firstColor);

        // Tuỳ theo loại sản phẩm để set cấu hình mặc định
        if (productType === "Iphone" || productType === "Ipad") {
          const firstCap = safeData.find(
            (v) => v.color === firstColor,
          )?.capacity;
          setSelectedCapacity(firstCap);
        } else if (productType === "Mac") {
          const firstRam = safeData.find((v) => v.color === firstColor)?.ram;
          setSelectedRam(firstRam);
          const firstRom = safeData.find(
            (v) => v.color === firstColor && v.ram === firstRam,
          )?.rom;
          setSelectedRom(firstRom);
        }
      })
      .catch((err) => console.error("Lỗi fetch chi tiết mua hàng:", err));
  }, [state, apiEndpoint, productType]);

  // 2. TÌM SẢN PHẨM HIỆN TẠI (currentProduct) DỰA TRÊN OPTIONS
  useEffect(() => {
    if (!variants.length || !selectedColor) return;

    const product = variants.find((v) => {
      if (v.color !== selectedColor) return false;
      if (
        (productType === "Iphone" || productType === "Ipad") &&
        v.capacity !== selectedCapacity
      )
        return false;
      if (
        productType === "Mac" &&
        (v.ram !== selectedRam || v.rom !== selectedRom)
      )
        return false;
      return true;
    });

    setCurrentProduct(product);
  }, [
    selectedColor,
    selectedCapacity,
    selectedRam,
    selectedRom,
    variants,
    productType,
  ]);

  // 3. COUNTDOWN
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
  const formatTime = (sec) =>
    `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

  // 4. CHUẨN BỊ DATA UI
  const colors = [...new Set(variants.map((v) => v.color))];
  const capacities = [
    ...new Set(
      variants.filter((v) => v.color === selectedColor).map((v) => v.capacity),
    ),
  ];
  const rams = [
    ...new Set(
      variants.filter((v) => v.color === selectedColor).map((v) => v.ram),
    ),
  ];
  const roms = [
    ...new Set(
      variants
        .filter((v) => v.color === selectedColor && v.ram === selectedRam)
        .map((v) => v.rom),
    ),
  ];

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

  // 5. CÁC HÀM XỬ LÝ THANH TOÁN
  const handlePayment = async () => {
    if (payMethod === "counter") {
      if (!window.confirm("Bạn xác nhận thanh toán tại quầy?")) return;
      try {
        await createBill({
          payment_method: "Thanh toán tại quầy",
          bank: "",
          payment_status: "Đang chờ thanh toán",
        });
        alert("Đã đặt hàng thành công!");
        navigate("/");
      } catch (err) {
        alert("Có lỗi xảy ra khi đặt hàng!");
      }
      return;
    }
    if (payMethod === "transfer") setShowQR(true);
  };

  const createBill = async ({ payment_method, bank, payment_status }) => {
    const isCash = payment_method === "Thanh toán tại quầy";

    const payload = {
      user_id: client?.id || null,
      name: receiver.fullname,
      phone: receiver.phone,
      product_id: currentProduct.id,
      product_type: productType,
      color: selectedColor,
      address_detail: isCash ? "" : receiver.address,
      commune: isCash ? "" : receiver.ward,
      district: isCash ? "" : receiver.district,
      city: isCash ? "" : receiver.province,
      date: new Date().toISOString().slice(0, 10),
      payment_method,
      bank,
      payment_status,
    };

    if (productType === "Iphone" || productType === "Ipad")
      payload.capacity = selectedCapacity;
    if (productType === "Mac") {
      payload.ram = selectedRam;
      payload.rom = selectedRom;
    }

    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/${apiEndpoint}/pay`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    return await res.json();
  };

  const handleAddToCart = async () => {
    if (!client?.id) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/add_to_cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: client.id,
          product_id: currentProduct.id,
          type: productType,
        }),
      });
      const data = await res.json();

      if (!data.success) return alert("Thêm vào giỏ hàng thất bại!");

      window.dispatchEvent(new Event("cart-updated"));
      if (
        window.confirm(
          "Đã thêm sản phẩm vào giỏ hàng thành công!\n\nNhấn OK để tới giỏ hàng\nNhấn Huỷ để về trang chủ",
        )
      ) {
        navigate("/cart");
      } else {
        navigate("/");
      }
    } catch (err) {
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng");
    }
  };

  return (
    <div className="buy-container">
      {!currentProduct ? (
        <div className="loading">Đang tải sản phẩm...</div>
      ) : (
        <>
          <h1 className="buy-title">{currentProduct.name}</h1>

          <div className="buy-content">
            {/* LEFT IMAGE */}
            <div className="buy-left">
              <div className="buy-image-container">
                <img
                  src={resolveProductImage(
                    currentProduct.name,
                    currentProduct.image,
                    productType,
                  )}
                  alt={currentProduct.name}
                  className="buy-image"
                />
              </div>

              <div className="price-container">
                <span className="price-content">
                  Tổng giá: {currentProduct.price.toLocaleString("vi-VN")}₫
                </span>
                <button
                  className="buy-product add-to-cart-btn"
                  onClick={handleAddToCart}
                >
                  Thêm vào giỏ hàng
                </button>
              </div>

              {/* QR PAY */}
              {showQR && !expired && (
                <div className="qr-section">
                  <h3>Quét mã để thanh toán</h3>
                  <img
                    className="qr-image"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrString}`}
                    alt="QR"
                    onClick={async () => {
                      try {
                        await createBill({
                          payment_method: "Chuyển khoản",
                          bank: bank,
                          payment_status: "Thành công",
                        });
                        alert("Thanh toán thành công!");
                        navigate("/");
                      } catch (err) {
                        alert("Thanh toán thất bại!");
                      }
                    }}
                  />
                  <div className="qr-info">
                    <p style={{ marginTop: "24px", marginBottom: "8px" }}>
                      Ngân hàng: {bank}
                    </p>
                    <p style={{ marginBottom: "8px" }}>
                      Số tài khoản: 121836686868
                    </p>
                    <p style={{ marginBottom: "16px" }}>
                      Tổng giá: {currentProduct.price.toLocaleString("vi-VN")}₫
                    </p>
                    <p>Thời gian hiệu lực: {formatTime(secondsLeft)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT CONTENT */}
            <div className="buy-right">
              {/* COLORS */}
              <div className="section">
                <h4>{colors.length > 1 ? "Chọn màu" : "Màu sắc"}</h4>
                <div className="option-list">
                  {colors.map((color) => {
                    const colorObj = variants.find((v) => v.color === color);
                    return (
                      <div
                        key={color}
                        className={`option-item ${selectedColor === color ? "active" : ""}`}
                        onClick={() => !showQR && setSelectedColor(color)}
                      >
                        <div
                          className="color-circle"
                          style={{ backgroundColor: colorObj.code }}
                        ></div>
                        {color}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CAPACITY (Cho iPhone / iPad) */}
              {(productType === "Iphone" || productType === "Ipad") &&
                capacities.length > 0 && (
                  <div className="section">
                    <h4>Chọn dung lượng</h4>
                    <div className="option-list">
                      {capacities.map((cap) => (
                        <div
                          key={cap}
                          className={`option-item ${selectedCapacity === cap ? "active" : ""}`}
                          onClick={() => !showQR && setSelectedCapacity(cap)}
                        >
                          {cap}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* RAM (Cho Mac) */}
              {productType === "Mac" && rams.length > 0 && (
                <div className="section">
                  <h4>Chọn ram</h4>
                  <div className="option-list">
                    {rams.map((cap) => (
                      <div
                        key={cap}
                        className={`option-item ${selectedRam === cap ? "active" : ""}`}
                        onClick={() => {
                          if (showQR) return;
                          setSelectedRam(cap);
                          const firstRom = variants.find(
                            (v) => v.color === selectedColor && v.ram === cap,
                          )?.rom;
                          setSelectedRom(firstRom);
                        }}
                      >
                        {cap}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ROM (Cho Mac) */}
              {productType === "Mac" && roms.length > 0 && (
                <div className="section">
                  <h4>Chọn rom</h4>
                  <div className="option-list">
                    {roms.map((rom) => (
                      <div
                        key={rom}
                        className={`option-item ${selectedRom === rom ? "active" : ""}`}
                        onClick={() => !showQR && setSelectedRom(rom)}
                      >
                        {rom}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Người Nhận và Phương Thức Thanh Toán giữ nguyên logic */}
              <h2 className="receiver-title">Thông tin người nhận</h2>
              <div className="receiver-form">
                {[
                  "fullname",
                  "phone",
                  "address",
                  "ward",
                  "district",
                  "province",
                ].map((field) => (
                  <div className="input-block" key={field}>
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

              <h2 className="payment-title">Chọn phương thức thanh toán</h2>
              <div className="payment-methods">
                <label className="radio-item payment-location">
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
                <label className="radio-item">
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

              {payMethod === "transfer" && !showQR && (
                <select
                  className="bank-select"
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

              {expired && (
                <div className="expired-box">
                  <h3>Thanh toán thất bại (hết thời gian).</h3>
                  <div className="expired-actions">
                    <button
                      className="retry-pay"
                      onClick={() => {
                        setShowQR(false);
                        setExpired(false);
                        setSecondsLeft(600);
                      }}
                    >
                      Tiếp tục thanh toán
                    </button>
                    <button className="back-home" onClick={() => navigate("/")}>
                      Quay về trang chủ
                    </button>
                  </div>
                </div>
              )}

              {!showQR && (
                <button
                  className={`submit-btn ${!isFormFilled ? "disabled" : ""}`}
                  disabled={!isFormFilled}
                  onClick={handlePayment}
                >
                  Thanh toán
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BuyPage;
