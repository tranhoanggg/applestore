// src/components/Breadcrumb/Breadcrumb.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import useBreadcrumbs from "use-react-router-breadcrumbs";
import { FaHome, FaChevronRight } from "react-icons/fa";
import "./BreadCrumb.css"; // Giữ nguyên CSS cũ

const Breadcrumb = () => {
  const location = useLocation();

  // 1. Cấu hình tên hiển thị cho các đường dẫn tĩnh
  const routes = [
    { path: "/", breadcrumb: null },
    {
      path: "/iphone/:name",
      breadcrumb: ({ match }) => decodeURIComponent(match.params.name),
    },
    {
      path: "/ipad/:name",
      breadcrumb: ({ match }) => decodeURIComponent(match.params.name),
    },
    {
      path: "/mac/:name",
      breadcrumb: ({ match }) => decodeURIComponent(match.params.name),
    },
    {
      path: "/watch/:name",
      breadcrumb: ({ match }) => decodeURIComponent(match.params.name),
    },
  ];

  // Hook tự động tạo danh sách breadcrumbs dựa trên URL hiện tại
  const breadcrumbs = useBreadcrumbs(routes, { disableDefaults: true });

  // Ẩn nếu đang ở trang chủ
  if (location.pathname === "/") return null;

  return (
    <div className="breadcrumb-container">
      {/* Luôn luôn thêm nút Home thủ công ở đầu cho đẹp */}
      <Link to="/" className="breadcrumb-item">
        <FaHome className="breadcrumb-home-icon" />
      </Link>

      {breadcrumbs.map(({ match, breadcrumb }, index) => {
        // Bỏ qua item đầu tiên nếu thư viện tự tạo root (thường là /)
        if (match.pathname === "/") return null;

        return (
          <React.Fragment key={match.pathname}>
            <FaChevronRight className="breadcrumb-separator" />

            <Link
              to={match.pathname}
              className={`breadcrumb-item ${
                index === breadcrumbs.length - 1 ? "active" : ""
              }`}
            >
              {breadcrumb}
            </Link>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Breadcrumb;
