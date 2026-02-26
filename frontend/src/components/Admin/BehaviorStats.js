import React, { useEffect, useState } from "react";
import "./BehaviorStats.css";

const BehaviorStats = () => {
  const [data, setData] = useState({ logs: [], stats: [] });

  useEffect(() => {
    // Gọi API lấy dữ liệu thống kê
    fetch(`${process.env.REACT_APP_API_URL}/api/log-stats`)
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch((err) => console.error("Lỗi tải thống kê:", err));
  }, []);

  return (
    <div className="behavior-stats-wrapper">
      <h2 className="admin-card-header">Tổng quan hành vi người dùng</h2>

      {/* BIỂU ĐỒ ĐƠN GIẢN (Dạng Card) */}
      <div className="stats-grid">
        {data.stats.map((item, index) => (
          <div key={index} className="stat-card">
            <h3>{item.action_type}</h3>
            <p className="stat-number">{item.count}</p>
          </div>
        ))}
      </div>

      {/* BẢNG CHI TIẾT */}
      <div className="admin-card">
        <div className="admin-card-header">Lịch sử hoạt động gần nhất</div>
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>User Identifier</th>
                <th>Hành vi</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString("vi-VN")}</td>
                    <td>{log.user_identifier}</td>
                    <td>
                      <span className={`tag ${log.action_type}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td>{log.action_detail}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    Chưa có dữ liệu ghi nhận
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BehaviorStats;
