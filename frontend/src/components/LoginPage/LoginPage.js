import React, { useState, useEffect } from "react";
import "./LoginPage.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Local state
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // Handle change
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const checkEnoughInformation = () => {
    let ok = true;

    if (!form.email) {
      document.querySelector(".email").classList.add("warning-active");
      ok = false;
    } else {
      document.querySelector(".email").classList.remove("warning-active");
    }

    if (!form.password) {
      document.querySelector(".password").classList.add("warning-active");
      ok = false;
    } else {
      document.querySelector(".password").classList.remove("warning-active");
    }

    return ok;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkEnoughInformation()) return;

    try {
      const res = await fetch("http://localhost:5000/client_account");
      const users = await res.json();

      const user = users.find((u) => u.email === form.email);

      if (!user) {
        document
          .querySelector(".loginpage-warning")
          .classList.add("warning-active");
        return;
      } else {
        document
          .querySelector(".loginpage-warning")
          .classList.remove("warning-active");
      }

      if (user.password !== form.password) {
        document
          .querySelector(".loginpage-warning")
          .classList.add("warning-active");
        return;
      } else {
        document
          .querySelector(".loginpage-warning")
          .classList.remove("warning-active");
      }

      alert("Đăng nhập thành công!");

      localStorage.setItem("client", JSON.stringify(user));
      window.dispatchEvent(new Event("storage"));

      if (location.state?.redirectTo) {
        navigate(location.state.redirectTo, {
          state: location.state.payload,
          replace: true,
        });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối server!");
    }
  };

  return (
    <div className="login-page">
      <div className="login-navbar">
        <div className="heading">Tài khoản Apple</div>
        <div className="option-container">
          <div
            className={`option option-active`}
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </div>
          <div className={`option`} onClick={() => navigate("/signup")}>
            Tạo tài khoản Apple
          </div>
        </div>
      </div>

      <div className="login-container">
        <h1 className="login-title">Đăng nhập để thanh toán nhanh hơn.</h1>
        <h2 className="login-subtitle">Đăng nhập vào Apple Store</h2>

        <div className="login-form">
          <div className="login-input-password-email">
            <input
              type="text"
              placeholder="Email hoặc số điện thoại"
              className="login-input login-input-email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />

            <div className="input-warning email">
              <img
                src={require(`../../assets/images/warning.png`)}
                alt="warning"
              />
              Nhập email của bạn.
            </div>
          </div>

          <div className="login-input-password-container">
            <input
              type="password"
              placeholder="Mật khẩu"
              className="login-input login-input-password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />

            <div className="input-warning password">
              <img
                src={require(`../../assets/images/warning.png`)}
                alt="warning"
              />
              Nhập password của bạn.
            </div>
          </div>

          <div className="loginpage-warning">
            <img
              src={require(`../../assets/images/warning.png`)}
              alt="warning"
            />
            Email/Số điện thoại hoặc mật khẩu chưa chính xác.
          </div>

          <button className="login-btn" onClick={handleSubmit}>
            Đăng nhập
          </button>

          <div className="login-links">
            <a href="#" className="link">
              Bạn đã quên mật khẩu?
            </a>
            <span>
              Bạn chưa có Tài khoản Apple?
              <a href="signup" className="link link-signup">
                Tạo Tài khoản Apple
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
