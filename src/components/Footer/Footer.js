import React from "react";
import "./Footer.css";
import RightImg from "../../assets/images/right.png";
import FbIcon from "../../assets/images/Icon/facebook.png";
import IgIcon from "../../assets/images/Icon/instagram.png";
import TiktokIcon from "../../assets/images/Icon/tiktok.png";
import YtIcon from "../../assets/images/Icon/youtube.png";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* VỀ BC CINEMA */}
        <div className="footer-column">
          <h2 className="footer-title">Về Apple</h2>
          <div className="footer-divider"></div>
          <p>
            <a href="#" className="footer-item-has-link">
              Liên hệ
            </a>
          </p>
          <a href="#">
            <img
              src={RightImg}
              alt="Đã thông báo bộ công thương"
              className="right-img"
            />
          </a>
        </div>

        {/* QUY ĐỊNH & ĐIỀU KHOẢN */}
        <div className="footer-column">
          <h2 href="#" className="footer-title">
            QUY ĐỊNH & ĐIỀU KHOẢN
          </h2>
          <div className="footer-divider"></div>
          <p>
            <a href="#" className="footer-item-has-link">
              Điều khoản
            </a>
          </p>
          <p>
            <a href="#" className="footer-item-has-link">
              Hướng dẫn đặt vé trực tuyến
            </a>
          </p>
          <p>
            <a href="#" className="footer-item-has-link">
              Quy định và chính sách chung
            </a>
          </p>
          <p>
            <a href="#" className="footer-item-has-link">
              Chính sách bảo vệ thông tin cá nhân của người tiêu dùng
            </a>
          </p>
        </div>

        {/* CHĂM SÓC KHÁCH HÀNG */}
        <div className="footer-column">
          <h2 className="footer-title">CHĂM SÓC KHÁCH HÀNG</h2>
          <div className="footer-divider"></div>
          <p>
            <strong>Hotline:</strong> 19002099
          </p>
          <p>
            <strong>Giờ làm việc:</strong> 9:00 - 22:00 (Tất cả các ngày bao gồm
            cả Lễ, Tết)
          </p>
          <p>
            <strong>Email hỗ trợ:</strong> cskh@apple.vn
          </p>

          <h5 className="social-title">MẠNG XÃ HỘI</h5>
          <div className="social-icons">
            <a
              href="https://www.facebook.com/apple"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={FbIcon} alt="facebook" className="social-icon" />
            </a>
            <a
              href="https://www.instagram.com/apple/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={IgIcon} alt="instagram" className="social-icon" />
            </a>
            <a
              href="https://www.tiktok.com/@apple"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={TiktokIcon} alt="tiktok" className="social-icon" />
            </a>
            <a
              href="https://www.youtube.com/@Apple"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={YtIcon} alt="youtube" className="social-icon" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
