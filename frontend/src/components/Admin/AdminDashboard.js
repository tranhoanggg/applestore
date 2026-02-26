import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeAssetSegment, resolveProductImage } from "../../utils/image";
import "./AdminDashboard.css";
import BehaviorStats from "./BehaviorStats";

const PRODUCT_FIELDS = {
  iphone: [
    "name",
    "capacity",
    "color",
    "code",
    "price",
    "tag",
    "quantity",
    "image",
  ],
  ipad: [
    "name",
    "capacity",
    "color",
    "code",
    "price",
    "tag",
    "quantity",
    "image",
  ],
  mac: [
    "name",
    "ram",
    "rom",
    "color",
    "code",
    "price",
    "tag",
    "quantity",
    "image",
  ],
  watch: ["name", "color", "code", "price", "tag", "quantity", "image"],
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const BAN_DURATIONS = [
  { label: "12 tiếng", value: 12 },
  { label: "24 tiếng", value: 24 },
  { label: "7 ngày", value: 168 },
  { label: "15 ngày", value: 360 },
  { label: "30 ngày", value: 720 },
  { label: "3 tháng", value: 2160 },
  { label: "6 tháng", value: 4320 },
  { label: "12 tháng", value: 8640 },
  { label: "Vĩnh viễn", value: "permanent" },
];

const BAN_REASONS = [
  "Ngôn từ không chuẩn mực",
  "Đặt hàng rồi huỷ đơn quá nhiều",
  "Lí do khác",
];

// Component phụ trách đếm ngược
const BanTimer = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      // Nếu hết thời gian cấm
      if (distance < 0) {
        setTimeLeft("Hết hạn");
        if (onExpire) onExpire(); // Gọi hàm refresh nếu cần
        return;
      }

      // Tính toán ngày, giờ, phút, giây
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let text = "";
      if (days > 0) text += `${days} ngày `;
      text += `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      setTimeLeft(text);
    };

    // Chạy ngay lập tức để không bị delay 1s đầu
    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    // Cleanup khi component bị hủy
    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  return (
    <span style={{ color: "#dc3545", fontWeight: "bold" }}>{timeLeft}</span>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const [productType, setProductType] = useState("iphone");
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({});
  const [imageUploads, setImageUploads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [pageVisible, setPageVisible] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [banDuration, setBanDuration] = useState(12);
  const [banReasonSelect, setBanReasonSelect] = useState(
    "Ngôn từ không chuẩn mực",
  );
  const [customBanReason, setCustomBanReason] = useState("");

  useEffect(() => {
    requestAnimationFrame(() => {
      setPageVisible(true);
    });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("client");
    if (!stored) {
      navigate("/login", { replace: true, state: { redirectTo: "/admin" } });
      return;
    }

    const parsed = JSON.parse(stored);
    if (parsed.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }

    setClient(parsed);
  }, [navigate]);

  useEffect(() => {
    if (client && !client.adminToken) {
      alert("Phiên admin không hợp lệ, vui lòng đăng nhập lại.");
      navigate("/login", { replace: true, state: { redirectTo: "/admin" } });
    }
  }, [client, navigate]);

  const headers = useMemo(() => {
    const base = {
      "Content-Type": "application/json",
      "X-User-Id": client?.id,
    };

    if (client?.adminToken) {
      base.Authorization = `Bearer ${client.adminToken}`;
    }

    return base;
  }, [client]);

  const fetchProducts = useCallback(
    async (type = productType) => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/${type}s`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Không thể tải sản phẩm", err);
        setProducts([]);
      }
    },
    [productType],
  );

  const fetchOrders = useCallback(async () => {
    if (!client) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/bills`, {
        headers,
      });
      const data = await res.json();
      setOrders(
        Array.isArray(data)
          ? data.map((bill) => ({ ...bill, items: bill.items || [] }))
          : [],
      );
    } catch (err) {
      console.error("Không thể tải đơn hàng", err);
    }
  }, [client, headers]);

  const fetchUsers = useCallback(async () => {
    if (!client) return;
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/client_account`,
      );
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Không thể tải người dùng", err);
    }
  }, [client]);

  useEffect(() => {
    if (!client) return;
    fetchProducts(productType);
    fetchOrders();
    fetchUsers();
  }, [client, fetchOrders, fetchProducts, fetchUsers, productType]);

  useEffect(() => {
    setProductForm({});
    setImageUploads([]);
    setEditingProduct(null);
    setProductSearch("");
    fetchProducts(productType);
  }, [productType, fetchProducts]);

  const handleProductChange = (key, value) => {
    setProductForm((prev) => ({ ...prev, [key]: value }));
  };

  const normalizeImageValue = (value) => {
    if (!value) return "";
    const trimmed = value.toString().trim();

    if (trimmed.startsWith("/")) return trimmed;
    if (trimmed.startsWith("assets/")) return `/${trimmed}`;

    return normalizeAssetSegment(trimmed);
  };

  const handleImageSelect = (files) => {
    if (!files?.length) return;

    const list = Array.from(files);

    Promise.all(
      list.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve({ name: file.name, data: reader.result });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((data) => {
        setImageUploads(data);
        if (!productForm.image) {
          const inferred = normalizeAssetSegment(
            productForm.color ||
              editingProduct?.color ||
              list[0].name.split(".")[0],
          );
          handleProductChange("image", inferred);
        }
      })
      .catch((err) => console.error("Không thể đọc file ảnh", err));
  };

  const matchesText = (target, query) => {
    if (!query) return true;
    if (!target) return false;
    return target.toLowerCase().includes(query.toLowerCase());
  };

  const buildAssetPath = (name, image, type, sequence = 1) =>
    resolveProductImage(name, image, capitalize(type), sequence);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;

    return products.filter((item) =>
      PRODUCT_FIELDS[productType].some((field) =>
        matchesText(String(item[field] ?? ""), productSearch),
      ),
    );
  }, [productSearch, productType, products]);

  const filteredOrders = useMemo(() => {
    if (!orderSearch) return orders;

    return orders.filter((bill) => {
      const itemsText = (bill.items || [])
        .map((i) => `${i.name} ${i.type} x${i.quantity}`)
        .join(" ");

      return [
        bill.name,
        bill.phone,
        bill.city,
        bill.product_type,
        bill.payment_status,
        itemsText,
      ].some((value) => matchesText(String(value || ""), orderSearch));
    });
  }, [orderSearch, orders]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;

    return users.filter((u) =>
      [u.name, u.email, u.role].some((value) =>
        matchesText(String(value || ""), userSearch),
      ),
    );
  }, [userSearch, users]);

  const submitProduct = async (mode) => {
    if (!client) return;
    setLoading(true);
    const url =
      mode === "create"
        ? `${process.env.REACT_APP_API_URL}/admin/products/${productType}`
        : `${process.env.REACT_APP_API_URL}/admin/products/${productType}/${editingProduct.id}`;

    const method = mode === "create" ? "POST" : "PUT";

    const requiredFields = PRODUCT_FIELDS[productType];

    if (mode === "create") {
      const missing = requiredFields.filter((field) => {
        if (field === "image" && imageUploads.length) return false;
        return !productForm[field]?.toString().trim();
      });

      if (missing.length) {
        alert(`Vui lòng nhập đầy đủ: ${missing.join(", ")}`);
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        ...productForm,
        image: normalizeImageValue(
          productForm.image || productForm.color || "",
        ),
      };

      if (imageUploads.length) {
        payload.images = imageUploads;
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Thao tác thất bại");
        return;
      }

      await fetchProducts();
      setProductForm({});
      setImageUploads([]);
      setEditingProduct(null);
      alert("Đã lưu sản phẩm");
    } catch (err) {
      console.error("Không thể lưu sản phẩm", err);
      alert("Không thể lưu sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (item) => {
    if (!client) return;
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/products/${productType}/${item.id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Xóa thất bại");
        return;
      }

      fetchProducts();
      alert("Đã xóa sản phẩm");
    } catch (err) {
      console.error("Không thể xóa sản phẩm", err);
      alert("Không thể xóa sản phẩm");
    }
  };

  const approveOrder = async (billId) => {
    const ok = window.confirm(
      "Bạn có chắc chắn muốn duyệt đơn hàng này của khách hàng?",
    );
    if (!ok) return;

    try {
      setCancelingId(billId);

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/bill/approve/${billId}`,
        {
          method: "PUT",
          headers,
        },
      );

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Không thể duyệt đơn");
        return;
      }

      fetchOrders();
      alert("Đã duyệt đơn hàng");
    } catch (err) {
      console.error("Không thể duyệt đơn", err);
      alert("Không thể duyệt đơn");
    } finally {
      setCancelingId(null);
    }
  };

  const cancelOrder = async (billId) => {
    const ok = window.confirm(
      "Bạn có chắc chắn muốn huỷ đơn hàng này của khách hàng?",
    );
    if (!ok) return;

    try {
      setCancelingId(billId);

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/bill/cancel/${billId}`,
        {
          method: "PUT",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Huỷ đơn thất bại");
        return;
      }

      fetchOrders();
      alert("Đã huỷ đơn hàng");
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi huỷ đơn");
    } finally {
      setCancelingId(null);
    }
  };

  const updateRole = async (id, role) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/users/${id}/role`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ role }),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Không thể cập nhật quyền");
        return;
      }

      fetchUsers();
      alert("Đã cập nhật quyền");
    } catch (err) {
      console.error("Không thể cập nhật quyền", err);
      alert("Không thể cập nhật quyền");
    }
  };

  const renderProductForm = () => {
    const fields = PRODUCT_FIELDS[productType];

    return (
      <div className="admin-card">
        <div className="admin-card-header">
          {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        </div>
        <div className="admin-form-grid">
          {fields.map((field) => {
            const value = productForm[field] ?? editingProduct?.[field] ?? "";

            if (field === "image") {
              const preview =
                imageUploads[0]?.data ||
                buildAssetPath(
                  editingProduct?.name || productForm.name || "",
                  value,
                  productType,
                );

              return (
                <label key={field} className="admin-field">
                  <span>Ảnh sản phẩm</span>
                  <input
                    value={value}
                    onChange={(e) =>
                      handleProductChange(
                        "image",
                        normalizeImageValue(e.target.value),
                      )
                    }
                    placeholder="Tên thư mục ảnh (ví dụ: blue)"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageSelect(e.target.files)}
                  />
                  {(preview || value) && (
                    <div className="admin-image-preview">
                      <img src={preview || value} alt="Xem trước" />
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          handleProductChange("image", "");
                          setImageUploads([]);
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                  {imageUploads.length > 1 && (
                    <div className="muted">
                      Đã chọn {imageUploads.length} ảnh
                    </div>
                  )}
                </label>
              );
            }

            if (field === "code") {
              const hexValue = value?.startsWith("#")
                ? value
                : `#${value || "000000"}`;

              return (
                <label key={field} className="admin-field">
                  <span>Mã màu (HEX)</span>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={hexValue}
                      onChange={(e) =>
                        handleProductChange("code", e.target.value)
                      }
                    />
                    <input
                      value={hexValue}
                      onChange={(e) =>
                        handleProductChange("code", e.target.value)
                      }
                      placeholder="Mã màu"
                    />
                  </div>
                </label>
              );
            }

            return (
              <label key={field} className="admin-field">
                <span>{capitalize(field)}</span>
                <input
                  value={value}
                  onChange={(e) => handleProductChange(field, e.target.value)}
                  placeholder={field}
                />
              </label>
            );
          })}
        </div>
        <div className="admin-actions">
          <button
            className="primary"
            onClick={() => submitProduct(editingProduct ? "update" : "create")}
            disabled={loading}
          >
            {editingProduct ? "Cập nhật" : "Thêm mới"}
          </button>
          {editingProduct && (
            <button
              className="ghost"
              onClick={() => {
                setEditingProduct(null);
                setProductForm({});
                setImageUploads([]);
              }}
            >
              Hủy
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderProductTable = () => (
    <div className="admin-card">
      <div className="admin-card-header">Danh sách {productType}</div>
      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              {PRODUCT_FIELDS[productType].map((f) => (
                <th key={f}>{capitalize(f)}</th>
              ))}
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                {PRODUCT_FIELDS[productType].map((f) => (
                  <td key={f} className={f === "image" ? "image-cell" : ""}>
                    {f === "image" ? (
                      item[f] ? (
                        <img
                          src={buildAssetPath(
                            item.name,
                            item.image,
                            productType,
                          )}
                          alt={item.name}
                          className="table-thumb"
                        />
                      ) : (
                        <span className="muted">Chưa có ảnh</span>
                      )
                    ) : (
                      item[f]
                    )}
                  </td>
                ))}
                <td className="admin-table-actions">
                  <button
                    className="ghost"
                    onClick={() => {
                      setEditingProduct(item);
                      setProductForm(item);
                      setImageUploads([]);
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    className="danger"
                    onClick={() => deleteProduct(item)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrderItems = (bill) => {
    const items = [...(bill.items || [])];

    if (!items.length && bill.product_type && bill.product_id) {
      items.push({
        name: bill.product_type,
        type: bill.product_type,
        product_id: bill.product_id,
        quantity: 1,
      });
    }

    if (!items.length) {
      return <span className="muted">Không có dữ liệu</span>;
    }

    return (
      <ul className="order-items">
        {items.map((item, idx) => (
          <li key={`${bill.id}-${idx}`}>
            <span className="order-item-name">
              {item.name || `#${item.product_id}`}
            </span>
            <span className="muted">
              x{item.quantity} • {item.type}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderOrders = () => (
    <div className="admin-card">
      <div className="admin-card-header">Quản lý đơn hàng</div>
      <div className="admin-search">
        <input
          value={orderSearch}
          onChange={(e) => setOrderSearch(e.target.value)}
          placeholder="Tìm kiếm theo khách hàng, sản phẩm hoặc trạng thái..."
        />
      </div>
      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Khách hàng</th>
              <th>Liên hệ</th>
              <th>Loại</th>
              <th>Sản phẩm</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Ngày</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((bill) => (
              <tr key={bill.id}>
                <td>#{bill.id}</td>
                <td>
                  <div>{bill.name}</div>
                  <div className="muted">User ID: {bill.user_id}</div>
                </td>
                <td>
                  <div>{bill.phone}</div>
                  <div className="muted">{bill.city}</div>
                </td>
                <td>{bill.product_type || "Giỏ hàng"}</td>
                <td>{renderOrderItems(bill)}</td>
                <td>{bill.payment_status}</td>
                <td>{bill.payment_method}</td>
                <td>{bill.date}</td>
                <td>
                  {bill.payment_status === "Đang chờ thanh toán" ? (
                    <div className="action-button-container">
                      <button
                        className="primary accept-order"
                        onClick={() => approveOrder(bill.id)}
                        disabled={cancelingId === bill.id}
                      >
                        Duyệt đơn
                      </button>
                      <button
                        className="primary cancel-order"
                        disabled={cancelingId === bill.id}
                        onClick={() => cancelOrder(bill.id)}
                      >
                        Huỷ đơn
                      </button>
                    </div>
                  ) : (
                    <span className="muted">Không khả dụng</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => {
    // Tìm user đang được chọn
    const selectedUser = users.find((u) => u.id === selectedUserId);
    const isSelectedUserAdmin = selectedUser?.role === "admin";

    return (
      <div className="admin-card">
        <div className="admin-card-header">Quyền người dùng</div>
        <div className="admin-search">
          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên, email hoặc quyền"
          />
        </div>
        <p className="muted">
          Chọn tài khoản trong bảng để cấp/gỡ quyền hoặc thực hiện cấm.
        </p>

        {/* --- FORM CẤM NGƯỜI DÙNG --- */}
        {selectedUserId && !isSelectedUserAdmin && (
          <div className="ban-control-panel">
            <div className="ban-control-title">
              Cấm người dùng: {selectedUser?.name} ({selectedUser?.email})
            </div>
            <div className="ban-form-grid">
              <div className="ban-input-group">
                <label>Thời gian cấm</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="ban-select"
                >
                  {BAN_DURATIONS.map((opt) => (
                    <option key={opt.label} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ban-input-group">
                <label>Lí do cấm</label>
                <select
                  value={banReasonSelect}
                  onChange={(e) => setBanReasonSelect(e.target.value)}
                  className="ban-select"
                >
                  {BAN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ban-input-group">
                <label>Chi tiết lí do</label>
                <input
                  type="text"
                  placeholder="Nhập lí do cụ thể..."
                  value={customBanReason}
                  onChange={(e) => setCustomBanReason(e.target.value)}
                  disabled={banReasonSelect !== "Lí do khác"}
                  className="ban-input"
                />
              </div>

              <button className="danger" onClick={submitBanUser}>
                Xác nhận
              </button>
            </div>
          </div>
        )}

        {/* --- BẢNG DANH SÁCH --- */}
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Role</th>
                <th>Thời gian cấm</th>
                <th>Lí do cấm</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                // LOGIC QUAN TRỌNG: Kiểm tra xem user có đang bị cấm thực sự không
                // User bị cấm nếu có ngày banned_until VÀ ngày đó nằm trong tương lai
                const isBanned =
                  u.banned_until && new Date(u.banned_until) > new Date();

                const isSelected = u.id === selectedUserId;

                return (
                  <tr
                    key={u.id}
                    className={isSelected ? "selected-row" : ""}
                    onClick={() =>
                      setSelectedUserId(selectedUserId === u.id ? null : u.id)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role || "user"}</td>

                    {/* Cột hiển thị đếm ngược */}
                    <td>
                      {isBanned ? (
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <BanTimer
                            targetDate={u.banned_until}
                            onExpire={() => fetchUsers()} // Reload khi hết giờ
                          />
                          <small className="muted">
                            Đến: {new Date(u.banned_until).toLocaleString()}
                          </small>
                        </div>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>

                    <td>{u.ban_reason || "-"}</td>

                    <td onClick={(e) => e.stopPropagation()}>
                      {/* Chỉ hiện nút Gỡ cấm nếu isBanned là true */}
                      {isBanned ? (
                        <button
                          className="primary"
                          onClick={(e) => submitUnbanUser(u.id, e)}
                          style={{ width: "70%" }}
                        >
                          Gỡ cấm
                        </button>
                      ) : (
                        <button
                          className="ghost"
                          onClick={() =>
                            updateRole(
                              u.id,
                              u.role === "admin" ? "user" : "admin",
                            )
                          }
                          disabled={client?.id === u.id}
                          style={{ width: "70%" }}
                        >
                          {u.role === "admin" ? "Gỡ quyền" : "Cấp quyền"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!client) return null;

  const submitBanUser = async () => {
    if (!selectedUserId || !client) return;

    const reason =
      banReasonSelect === "Lí do khác" ? customBanReason : banReasonSelect;

    if (!reason.trim()) {
      alert("Vui lòng nhập lí do cấm");
      return;
    }

    if (!window.confirm("Xác nhận cấm người dùng này?")) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/users/${selectedUserId}/ban`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            duration: banDuration, // Backend cần xử lý logic cộng thời gian
            reason: reason,
          }),
        },
      );

      if (!res.ok) throw new Error("Lỗi khi cấm người dùng");

      alert("Đã cấm người dùng thành công");
      fetchUsers(); // Reload list
      setSelectedUserId(null); // Reset selection
      setCustomBanReason(""); // Reset form
    } catch (err) {
      console.error(err);
      alert("Không thể cấm người dùng");
    }
  };

  const submitUnbanUser = async (userId, e) => {
    e.stopPropagation(); // Ngăn việc click nút kích hoạt chọn dòng
    if (!window.confirm("Bạn muốn gỡ cấm cho người dùng này?")) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/users/${userId}/unban`,
        {
          method: "PUT", // Hoặc DELETE tuỳ backend
          headers,
        },
      );

      if (!res.ok) throw new Error("Lỗi khi gỡ cấm");

      alert("Đã gỡ cấm thành công");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Không thể gỡ cấm");
    }
  };

  return (
    <div
      className={`admin-page ${
        pageVisible ? "page-enter-active" : "page-enter"
      }`}
    >
      <div className="admin-header">
        <h1>Bảng điều khiển Admin</h1>
        <p>Quản lý sản phẩm, đơn hàng và quyền người dùng.</p>
        <div className="admin-tabs">
          <button
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            Sản phẩm
          </button>
          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            Đơn hàng
          </button>
          <button
            className={activeTab === "roles" ? "active" : ""}
            onClick={() => setActiveTab("roles")}
          >
            Quyền truy cập
          </button>
          <button
            className={activeTab === "statistics" ? "active" : ""}
            onClick={() => setActiveTab("statistics")}
          >
            Thống kê hành vi
          </button>
        </div>
      </div>

      {activeTab === "products" && (
        <>
          <div className="admin-controls">
            {Object.keys(PRODUCT_FIELDS).map((key) => (
              <button
                key={key}
                className={productType === key ? "active" : ""}
                onClick={() => setProductType(key)}
              >
                {capitalize(key)}
              </button>
            ))}
          </div>
          <div className="admin-search">
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm theo tên, mã hoặc màu..."
            />
          </div>
          {renderProductForm()}
          {renderProductTable()}
        </>
      )}

      {activeTab === "orders" && renderOrders()}
      {activeTab === "roles" && renderUsers()}
      {activeTab === "statistics" && <BehaviorStats />}
    </div>
  );
};

export default AdminDashboard;
