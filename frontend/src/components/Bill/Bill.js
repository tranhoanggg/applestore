import React, { useEffect, useState } from "react";
import "./Bill.css";

const Bill = () => {
  const client = JSON.parse(localStorage.getItem("client"));
  const [bills, setBills] = useState([]);
  const [expandedBill, setExpandedBill] = useState(null);
  const [billDetails, setBillDetails] = useState({});
  const [cancelingId, setCancelingId] = useState(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState("all");

  const loadBills = async () => {
    const res = await fetch(`http://localhost:5000/bill/${client.id}`);
    const data = await res.json();
    setBills(data);
  };

  useEffect(() => {
    if (!client) return;

    loadBills();
  }, [client]);

  const availableDates = Array.from(
    new Set(bills.map((b) => new Date(b.date).toLocaleDateString("vi-VN")))
  );

  // group bill theo ngày
  const billsByDate = bills.reduce((acc, bill) => {
    const date = new Date(bill.date).toLocaleDateString("vi-VN");
    if (!acc[date]) acc[date] = [];
    acc[date].push(bill);
    return acc;
  }, {});

  const toggleDetail = async (billId) => {
    if (expandedBill === billId) {
      setExpandedBill(null);
      return;
    }

    if (!billDetails[billId]) {
      const res = await fetch(`http://localhost:5000/bill-full/${billId}`);
      const data = await res.json();

      setBillDetails((prev) => ({
        ...prev,
        [billId]: data.items,
      }));
    }

    setExpandedBill(billId);
  };

  const renderStatus = (status) =>
    status === "Thành công"
      ? "Giao dịch thành công"
      : status === "Đã huỷ"
      ? "Đã huỷ"
      : "Đang chờ thanh toán";

  const renderPayment = (method, bank) =>
    method === "Thanh toán tại quầy"
      ? "Thanh toán tại quầy"
      : `Chuyển khoản qua ngân hàng ${bank}`;

  const cancelBill = async (billId) => {
    const ok = window.confirm("Bạn có chắc chắn muốn huỷ đơn hàng này?");
    if (!ok) return;

    try {
      setCancelingId(billId);

      const res = await fetch(`http://localhost:5000/bill/cancel/${billId}`, {
        method: "PUT",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Huỷ đơn thất bại");
        return;
      }

      // Nếu đang mở chi tiết → đóng lại
      if (expandedBill === billId) {
        setExpandedBill(null);
      }

      // Reload danh sách bill để cập nhật trạng thái
      await loadBills();
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi huỷ đơn");
    } finally {
      setCancelingId(null);
    }
  };

  const normalize = (value) => value?.toString().toLowerCase() || "";

  const billMatchSearch = (bill, items, keyword) => {
    const key = normalize(keyword);

    // === 1. Search ở level bill ===
    const billFields = [
      bill.name,
      bill.payment_method,
      bill.bank,
      bill.payment_status,
    ];

    const matchBillInfo = billFields
      .filter(Boolean)
      .some((f) => normalize(f).includes(key));

    if (matchBillInfo) return true;

    // === 2. Search trong sản phẩm (GIỮ LOGIC CŨ) ===
    return items?.some((item) => {
      const { product, type } = item;
      if (!product) return false;

      const searchableFields = [
        product.name,
        product.color,
        product.image,
        product.price?.toString(),
      ];

      if (type === "Iphone" || type === "Ipad") {
        searchableFields.push(product.capacity);
      }

      if (type === "Mac") {
        searchableFields.push(product.ram, product.rom);
      }

      return searchableFields
        .filter(Boolean)
        .some((field) => normalize(field).includes(key));
    });
  };

  const filteredBillsByDate = Object.entries(billsByDate).reduce(
    (acc, [date, list]) => {
      // Filter theo ngày
      if (selectedDate !== "all" && date !== selectedDate) return acc;

      const filteredList = list.filter((bill) =>
        billMatchSearch(bill, billDetails[bill.id], searchKeyword)
      );

      if (filteredList.length) {
        acc[date] = filteredList;
      }

      return acc;
    },
    {}
  );

  return (
    <section className="bill-container">
      <h1 className="bill-title">Đơn hàng của {client.name}</h1>

      {/* ===== SEARCH BAR ===== */}
      <div className="bill-search-bar">
        <select
          className="bill-date-filter"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          <option value="all">Tất cả các ngày</option>
          {availableDates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm trong giỏ hàng..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          alt="search"
          className="bill-search-icon"
          onClick={() => setSearchKeyword(searchKeyword)}
        >
          <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
        </svg>
      </div>

      {Object.entries(filteredBillsByDate).map(([date, list]) => (
        <div key={date} className="bill-day">
          <h2 className="bill-date">{date}</h2>

          {list.map((bill) => (
            <div className="bill-card" key={bill.id}>
              <div className="bill-summary">
                <div>
                  <p>
                    <b>Người nhận:</b> {bill.name}
                  </p>
                  <p>
                    <b>Số điện thoại:</b>{" "}
                    {expandedBill === bill.id ? bill.phone : "********"}
                  </p>
                  <p>
                    <b>Phương thức:</b>{" "}
                    {renderPayment(bill.payment_method, bill.bank)}
                  </p>
                  <p>
                    <b>Tình trạng:</b> {renderStatus(bill.payment_status)}
                  </p>
                </div>

                <div className="bill-actions">
                  <button onClick={() => toggleDetail(bill.id)}>
                    Thông tin chi tiết
                  </button>

                  {/* ĐANG CHỜ THANH TOÁN → HUỶ */}
                  {bill.payment_status === "Đang chờ thanh toán" && (
                    <button
                      className="danger"
                      onClick={() => cancelBill(bill.id)}
                      disabled={cancelingId === bill.id}
                    >
                      {cancelingId === bill.id ? "Đang huỷ..." : "Huỷ đơn"}
                    </button>
                  )}

                  {/* ĐÃ HUỶ → MUA LẠI (DISABLED) */}
                  {bill.payment_status === "Đã huỷ" && (
                    <div className="tooltip-wrapper">
                      <button className="buy-again" disabled>
                        Mua lại
                      </button>
                      <span className="tooltip">
                        Chức năng này hiện chưa hỗ trợ.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* DETAIL */}
              {expandedBill === bill.id && billDetails[bill.id] && (
                <div className="bill-items-container">
                  {billDetails[bill.id].map((item, idx) => {
                    const { product, quantity, type } = item;

                    if (!product) return null;

                    return (
                      <div className="bill-item" key={idx}>
                        <img
                          className="bill-img"
                          src={`/assets/images/${type}/${product.name
                            .toLowerCase()
                            .replace(/\s+/g, "")}/${product.image}/1.png`}
                          alt={product.name}
                        />

                        <div className="bill-info">
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

                        <div className="bill-quantity">
                          <span style={{ width: "120px" }}>
                            Số lượng: {quantity}
                          </span>
                        </div>

                        <div className="bill-price">
                          {(product.price * quantity).toLocaleString()}đ
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
};

export default Bill;
