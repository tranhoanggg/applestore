import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BuyMac.css";

const BuyMac = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [variants, setVariants] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedRom, setSelectedRom] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Lấy user
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

  // FETCH SẢN PHẨM
  useEffect(() => {
    fetch(`http://localhost:5000/macs/buy/${state.product_name}`)
      .then((res) => res.json())
      .then((data) => {
        setVariants(data);

        const firstColor = data[0].color;
        setSelectedColor(firstColor);

        const firstRam = data.find((v) => v.color === firstColor)?.ram;
        setSelectedRam(firstRam);

        const firstRom = data.find(
          (v) => v.color === firstColor && v.ram === firstRam
        )?.rom;
        setSelectedRom(firstRom);
      });
  }, [state]);

  useEffect(() => {
    if (!variants.length) return;

    const product = variants.find(
      (v) =>
        v.color === selectedColor &&
        v.ram === selectedRam &&
        v.rom === selectedRom
    );

    setCurrentProduct(product);
  }, [selectedColor, selectedRam, selectedRom, variants]);

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

  // Data UI chuẩn bị
  const colors = [...new Set(variants.map((v) => v.color))];

  const rams = [
    ...new Set(
      variants.filter((v) => v.color === selectedColor).map((v) => v.ram)
    ),
  ];

  const roms = [
    ...new Set(
      variants
        .filter((v) => v.color === selectedColor && v.ram === selectedRam)
        .map((v) => v.rom)
    ),
  ];

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

  const handlePayment = async () => {
    // === THANH TOÁN TẠI QUẦY ===
    if (payMethod === "counter") {
      const confirmPay = window.confirm("Bạn xác nhận thanh toán tại quầy?");

      if (!confirmPay) return; // Huỷ → giữ nguyên trang

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

  const createBill = async ({ payment_method, bank, payment_status }) => {
    const isCash = payment_method === "Thanh toán tại quầy";

    const payload = {
      user_id: client?.id || null,
      name: receiver.fullname,
      phone: receiver.phone,
      product_id: currentProduct.id,
      product_type: "Mac",
      color: selectedColor,
      ram: selectedRam,
      rom: selectedRom,
      address_detail: isCash ? "" : receiver.address,
      commune: isCash ? "" : receiver.ward,
      district: isCash ? "" : receiver.district,
      city: isCash ? "" : receiver.province,
      date: new Date().toISOString().slice(0, 10),
      payment_method,
      bank,
      payment_status,
    };

    const res = await fetch("http://localhost:5000/macs/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  };

  const handleAddToCart = async () => {
    if (!client?.id) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/add_to_cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: client.id,
          product_id: currentProduct.id,
          type: "Mac",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert("Thêm vào giỏ hàng thất bại!");
        return;
      }

      window.dispatchEvent(new Event("cart-updated"));

      const goToCart = window.confirm(
        "Đã thêm sản phẩm vào giỏ hàng thành công!\n\nNhấn OK để tới giỏ hàng\nNhấn Huỷ để về trang chủ"
      );

      if (goToCart) {
        navigate("/cart");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng");
    }
  };

  return (
    <div className="buy-container">
      {/* Nếu chưa load sản phẩm */}
      {!currentProduct ? (
        <div className="loading">Đang tải sản phẩm...</div>
      ) : (
        <>
          <h1 className="buy-title">{currentProduct.name}</h1>

          <div className="buy-content">
            <>
              {/* LEFT IMAGE */}
              <div className="buy-left">
                <div className="buy-image-container">
                  <img
                    src={`/assets/images/Mac/${currentProduct.name
                      .toLowerCase()
                      .replace(/\s+/g, "")}/${currentProduct.image}/1.png`}
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
                          console.error(err);
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
                        Tổng giá: {currentProduct.price.toLocaleString("vi-VN")}
                        ₫
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
                  <h4>Chọn màu</h4>
                  <div className="color-list">
                    {colors.map((color) => {
                      const colorObj = variants.find((v) => v.color === color);
                      return (
                        <div
                          key={color}
                          className={`color-item ${
                            selectedColor === color ? "active" : ""
                          }`}
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

                {/* RAM */}
                <div className="section">
                  <h4>Chọn ram</h4>
                  <div className="ram-list">
                    {rams.map((cap) => (
                      <div
                        key={cap}
                        className={`ram-item ${
                          selectedRam === cap ? "active" : ""
                        }`}
                        onClick={() => {
                          if (showQR) return;

                          setSelectedRam(cap);

                          const firstRom = variants.find(
                            (v) => v.color === selectedColor && v.ram === cap
                          )?.rom;

                          setSelectedRom(firstRom);
                        }}
                      >
                        {cap}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROM */}
                <div className="section">
                  <h4>Chọn rom</h4>
                  <div className="rom-list">
                    {roms.map((rom) => (
                      <div
                        key={rom}
                        className={`rom-item ${
                          selectedRom === rom ? "active" : ""
                        }`}
                        onClick={() => !showQR && setSelectedRom(rom)}
                      >
                        {rom}
                      </div>
                    ))}
                  </div>
                </div>

                {/* RECEIVER INFO */}
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
                            [
                              "address",
                              "ward",
                              "district",
                              "province",
                            ].includes(field))
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

                {/* BANK SELECT */}
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

                {/* EXPIRED */}
                {expired && (
                  <div className="expired-box">
                    <h3>Thanh toán thất bại (hết thời gian).</h3>
                    <div className="expired-actions">
                      <button className="retry-pay" onClick={resetTransfer}>
                        Tiếp tục thanh toán
                      </button>

                      <button
                        className="back-home"
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
                    className={`submit-btn ${!isFormFilled ? "disabled" : ""}`}
                    disabled={!isFormFilled}
                    onClick={handlePayment}
                  >
                    Thanh toán
                  </button>
                )}
              </div>
            </>
          </div>
        </>
      )}
    </div>
  );
};

export default BuyMac;
