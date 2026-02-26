import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import "./RatingSection.css"; // CSS ở bước 4

const RatingSection = ({ productName }) => {
  const [stats, setStats] = useState({
    total_count: 0,
    average_rating: 0,
    my_rating: null,
  });
  const [hover, setHover] = useState(null); // Để tạo hiệu ứng hover sao
  const [selectedRating, setSelectedRating] = useState(0); // Sao người dùng đang chọn
  const [client, setClient] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("client");
    if (stored) setClient(JSON.parse(stored));
  }, []);

  const fetchRatings = () => {
    const headers = {};
    if (client) headers["x-user-id"] = client.id;

    fetch(
      `${process.env.REACT_APP_API_URL}/api/ratings/${encodeURIComponent(productName)}`,
      { headers },
    )
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        if (data.my_rating) {
          setSelectedRating(data.my_rating.rating);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (productName) fetchRatings();
  }, [productName, client]);

  const handleSubmitRating = (ratingValue) => {
    if (!client) {
      alert("Vui lòng đăng nhập để đánh giá!");
      return;
    }

    if (stats.my_rating) {
      alert("Bạn đã đánh giá sản phẩm này rồi!");
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/api/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: client.id,
        product_name: productName,
        rating: ratingValue,
        comment: "", // Có thể mở rộng thêm ô nhập comment
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Cảm ơn bạn đã đánh giá!");
          fetchRatings(); // Load lại điểm trung bình mới
        } else {
          alert(data.message);
        }
      });
  };

  return (
    <div className="rating-container">
      <h3>Đánh giá sản phẩm</h3>

      {/* Phần hiển thị điểm trung bình */}
      <div className="rating-summary">
        <div className="rating-score">
          <span className="big-score">{stats.average_rating}</span>
          <span className="total-stars">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                color={
                  i < Math.round(stats.average_rating) ? "#ffc107" : "#e4e5e9"
                }
              />
            ))}
          </span>
        </div>
        <div className="rating-count">{stats.total_count} lượt đánh giá</div>
      </div>

      {/* Phần user chọn sao */}
      <div className="user-rating-input">
        <p>{stats.my_rating ? "Đánh giá của bạn:" : "Gửi đánh giá của bạn:"}</p>
        <div className="star-input-group">
          {[...Array(5)].map((_, i) => {
            const ratingValue = i + 1;
            return (
              <label key={i}>
                <input
                  type="radio"
                  name="rating"
                  value={ratingValue}
                  onClick={() => handleSubmitRating(ratingValue)}
                  disabled={!!stats.my_rating} // Disable nếu đã đánh giá
                  style={{ display: "none" }}
                />
                <FaStar
                  className="star-icon"
                  color={
                    ratingValue <= (hover || selectedRating)
                      ? "#ffc107"
                      : "#e4e5e9"
                  }
                  size={30}
                  onMouseEnter={() => !stats.my_rating && setHover(ratingValue)}
                  onMouseLeave={() => !stats.my_rating && setHover(null)}
                  style={{ cursor: stats.my_rating ? "default" : "pointer" }}
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingSection;
