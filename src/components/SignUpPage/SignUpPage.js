import React, { useState, useEffect } from "react";
import "./SignUpPage.css";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Local state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    day: "",
    month: "",
    year: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  // Handle change
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Generate day, month, year options
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1960 + 1 },
    (_, i) => currentYear - i
  );

  const checkInformation = async () => {
    let ok = true;

    if (!form.firstName) {
      document.querySelector(".firstname").classList.add("warning-active");
      ok = false;
    } else {
      document.querySelector(".firstname").classList.remove("warning-active");
    }

    if (!form.lastName) {
      document.querySelector(".lastname").classList.add("warning-active");
      ok = false;
    } else {
      document.querySelector(".lastname").classList.remove("warning-active");
    }

    if (!form.day || !form.month || !form.year) {
      document.querySelector(".birthday").classList.add("warning-active");
      ok = false;
    } else {
      document.querySelector(".birthday").classList.remove("warning-active");
    }

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

    if (!form.confirmPassword) {
      document
        .querySelector(".password-confirm-1")
        .classList.add("warning-active");
      ok = false;
    } else {
      document
        .querySelector(".password-confirm-1")
        .classList.remove("warning-active");
    }

    if (!form.phone) {
      document.querySelector(".phone").classList.add("warning-active");
      ok = false;
    } else {
      document.querySelector(".phone").classList.remove("warning-active");
    }

    const list = await fetch("http://localhost:5000/client_account")
      .then((res) => res.json())
      .catch(() => []);

    const existedEmail = list.find((u) => u.email === form.email);
    if (existedEmail) {
      document.querySelector(".email-existed").classList.add("warning-active");
      ok = false;
    } else {
      document
        .querySelector(".email-existed")
        .classList.remove("warning-active");
    }

    const existedPhone = list.find((u) => u.phone === form.phone);
    if (existedPhone) {
      document.querySelector(".phone-existed").classList.add("warning-active");
      ok = false;
    } else {
      document
        .querySelector(".phone-existed")
        .classList.remove("warning-active");
    }

    if (form.password !== form.confirmPassword) {
      document
        .querySelector(".password-confirm-2")
        .classList.add("warning-active");
      ok = false;
    } else {
      document
        .querySelector(".password-confirm-2")
        .classList.remove("warning-active");
    }

    return ok;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const ok = await checkInformation();
    if (!ok) return;

    // Convert to yyyy-mm-dd
    const birthday = `${form.year}-${String(form.month).padStart(
      2,
      "0"
    )}-${String(form.day).padStart(2, "0")}`;

    const payload = {
      name: `${form.lastName} ${form.firstName}`,
      birthday,
      email: form.email,
      phone: form.phone,
      password: form.password,
    };

    fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Đăng ký thành công!");
          navigate("/login");
        } else {
          alert("Đăng ký thất bại!");
        }
      })
      .catch((error) => {
        console.error(error);
        alert("Lỗi kết nối server!");
      });
  };

  return (
    <div className="signup-page">
      <div className="signup-navbar">
        <div className="heading">Tài khoản Apple</div>
        <div className="option-container">
          <div className={`option`} onClick={() => navigate("/login")}>
            Đăng nhập
          </div>
          <div
            className={`option option-active`}
            onClick={() => navigate("/signup")}
          >
            Tạo tài khoản Apple
          </div>
        </div>
      </div>

      <div className="signup-container">
        <h1 className="signup-title">Tạo Tài khoản Apple</h1>
        <p className="signup-subtitle">
          Chỉ cần có một Tài khoản Apple để truy cập vào tất cả dịch vụ của
          Apple.
          <div>
            Bạn đã có Tài khoản Apple?{" "}
            <span onClick={() => navigate("/login")}>Đăng Nhập</span>
          </div>
        </p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="row">
            <div className="signup-form-name">
              <input
                type="text"
                placeholder="Họ"
                className="input name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
              />
              <div className="input-warning lastname">
                <img
                  src={require(`../../assets/images/warning.png`)}
                  alt="warning"
                />
                Nhập họ của bạn.
              </div>
            </div>
            <div className="signup-form-name">
              <input
                type="text"
                placeholder="Tên"
                className="input name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
              />
              <div className="input-warning firstname">
                <img
                  src={require(`../../assets/images/warning.png`)}
                  alt="warning"
                />
                Nhập tên của bạn.
              </div>
            </div>
          </div>

          <label className="label">Ngày sinh</label>
          <div className="input-form-birthday">
            <div className="row">
              <select
                className="input select"
                name="day"
                value={form.day}
                onChange={handleChange}
              >
                <option>Ngày</option>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                className="input select"
                name="month"
                value={form.month}
                onChange={handleChange}
              >
                <option>Tháng</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                className="input select"
                name="year"
                value={form.year}
                onChange={handleChange}
              >
                <option>Năm</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-warning birthday">
              <img
                src={require(`../../assets/images/warning.png`)}
                alt="warning"
              />
              Nhập ngày tháng năm sinh của bạn.
            </div>
          </div>

          <div className="signup-form-email">
            <input
              type="email"
              placeholder="name@example.com"
              className="input full"
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

            <div className="input-warning email-existed">
              <img
                src={require(`../../assets/images/warning.png`)}
                alt="warning"
              />
              Email này đã được đăng ký tài khoản.
            </div>
          </div>

          <div className="signup-form-password">
            <input
              type="password"
              placeholder="Mật khẩu"
              className="input full"
              name="password"
              value={form.password}
              onChange={handleChange}
            />

            <div className="input-warning password">
              <img
                src={require(`../../assets/images/warning.png`)}
                alt="warning"
              />
              Nhập mật khẩu của bạn.
            </div>
          </div>

          <div className="signup-form-password-confirm">
            <input
              type="password"
              placeholder="Xác nhận Mật khẩu"
              className="input full"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
            />

            <div className="input-warning password-confirm-1">
              <img
                src={require(`../../assets/images/warning.png`)}
                alt="warning"
              />
              Hãy xác nhận mật khẩu của bạn.
            </div>

            <div className="input-warning password-confirm-2">
              <img
                src={require(`../../assets/images/warning.png`)}
                alt="warning"
              />
              Mật khẩu xác nhận chưa khớp.
            </div>
          </div>

          <div className="signup-form-phone">
            <input
              type="tel"
              placeholder="Số điện thoại"
              className="input full"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />

            <div className="input-warning phone">
              <img
                src={require(`../../assets/images/warning.png`)}
                alt="warning"
              />
              Nhập số điện thoại của bạn.
            </div>

            <div className="input-warning phone-existed">
              <img
                src={require(`../../assets/images/warning.png`)}
                alt="warning"
              />
              Số điện thoại này đã được đăng ký tài khoản.
            </div>
          </div>

          <div className="info-box">
            <img
              src="/assets/images/signup.png"
              alt="info"
              className="info-img"
            />
            <p className="info-text">
              Thông tin về Tài khoản Apple của bạn được sử dụng để cho phép bạn
              đăng nhập an toàn và truy cập vào dữ liệu của mình.
            </p>
          </div>

          <button className="btn-submit">Đăng ký</button>
        </form>
      </div>
    </div>
  );
}
