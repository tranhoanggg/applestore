export const ACTION_TYPES = {
  VIEW: "VIEW", // Xem trang, xem chi tiết
  CLICK: "CLICK", // Click nút mua, thêm giỏ hàng
  SEARCH: "SEARCH", // Tìm kiếm sản phẩm
  LOGIN: "LOGIN", // Đăng nhập
  LOGOUT: "LOGOUT", // Đăng xuất
  FILTER: "FILTER", // Lọc sản phẩm
  ERROR: "ERROR", // Gặp lỗi
};

export const logBehavior = async (actionType, actionDetail) => {
  try {
    const storedClient = localStorage.getItem("client");
    let userIdentifier = "Guest";

    if (storedClient) {
      const client = JSON.parse(storedClient);
      userIdentifier = `${client.id} - ${client.name || client.email}`;
    }

    await fetch(`${process.env.REACT_APP_API_URL}/api/log-behavior`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_identifier: userIdentifier,
        action_type: actionType,
        action_detail: actionDetail,
      }),
    });
  } catch (error) {
    console.error("Logging error:", error);
  }
};
