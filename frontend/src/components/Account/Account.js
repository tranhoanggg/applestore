import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Account.css";

export default function Account() {
  const navigate = useNavigate();
  const client = JSON.parse(localStorage.getItem("client") || "{}");

  const [originalUser, setOriginalUser] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    day: "",
    month: "",
    year: "",
    email: "",
    phone: "",
  });

  // ================= LOAD USER =================
  useEffect(() => {
    if (!client?.id) return;

    fetch(`http://localhost:5000/client_account/${client.id}`)
      .then((res) => res.json())
      .then((data) => {
        const user = data[0];

        setOriginalUser(user);

        const date = new Date(user.birthday);

        const [lastName, ...first] = user.name.split(" ");

        setForm({
          firstName: first.join(" "),
          lastName,
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          email: user.email,
          phone: user.phone,
        });
      })
      .catch(console.error);
  }, [client?.id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= VALIDATE =================
  const checkInformation = async () => {
    let ok = true;

    const check = (condition, selector) => {
      const el = document.querySelector(selector);
      if (!condition) {
        el.classList.add("warning-active");
        ok = false;
      } else {
        el.classList.remove("warning-active");
      }
    };

    check(form.firstName, ".firstname");
    check(form.lastName, ".lastname");
    check(form.day && form.month && form.year, ".birthday");
    check(form.email, ".email");
    check(form.phone, ".phone");

    const list = await fetch("http://localhost:5000/client_account")
      .then((res) => res.json())
      .catch(() => []);

    const existedEmail = list.find(
      (u) => u.email === form.email && u.id !== client.id
    );
    if (existedEmail) {
      document.querySelector(".email-existed").classList.add("active");
      ok = false;
    } else {
      document.querySelector(".email-existed").classList.remove("active");
    }

    const existedPhone = list.find(
      (u) => u.phone === form.phone && u.id !== client.id
    );
    if (existedPhone) {
      document.querySelector(".phone-existed").classList.add("active");
      ok = false;
    } else {
      document.querySelector(".phone-existed").classList.remove("active");
    }

    return ok;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await checkInformation();
    if (!ok) return;

    const birthday = `${form.year}-${String(form.month).padStart(
      2,
      "0"
    )}-${String(form.day).padStart(2, "0")}`;

    const payload = {
      id: client.id,
      name: `${form.lastName} ${form.firstName}`,
      birthday,
      email: form.email,
      phone: form.phone,
    };

    const normalizeDate = (d) => {
      const date = new Date(d);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    // ===== SO SÁNH DATA =====
    const noChange =
      originalUser.name === payload.name &&
      normalizeDate(originalUser.birthday) === payload.birthday &&
      originalUser.email === payload.email &&
      originalUser.phone === payload.phone;

    if (noChange) {
      alert("Không phát hiện thông tin cần cập nhật");
      return;
    }

    // ===== UPDATE =====
    fetch("http://localhost:5000/client_account/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (!data.success) {
          alert("Cập nhật thất bại!");
          return;
        }

        alert("Đã cập nhật thông tin thành công!");

        // Reload user
        const refreshedData = await fetch(
          `http://localhost:5000/client_account/${client.id}`
        ).then((res) => res.json());

        const refreshed = refreshedData[0];

        setOriginalUser(refreshed);

        localStorage.setItem("client", JSON.stringify(refreshed));

        const date = new Date(refreshed.birthday);
        const [ln, ...fn] = refreshed.name.split(" ");

        setForm((prev) => ({
          ...prev,
          firstName: fn.join(" "),
          lastName: ln,
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          email: refreshed.email,
          phone: refreshed.phone,
        }));
      })
      .catch(() => alert("Lỗi kết nối server!"));
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1960 + 1 },
    (_, i) => currentYear - i
  );

  return (
    <div className="account-page">
      <div className="account-navbar">
        <div className="heading">Tài khoản Apple</div>
        <div className="option-container">
          <div className={`option`} onClick={() => navigate("/password-reset")}>
            Đổi mật khẩu
          </div>
          <div className={`option active`} onClick={() => navigate("/account")}>
            Thông tin tài khoản
          </div>
        </div>
      </div>

      <div className="account-container">
        <form className="account-form" onSubmit={handleSubmit}>
          <div className="row">
            <div className="account-form-name">
              <label className="left-label" htmlFor="firstName">
                Họ
              </label>
              <input
                type="text"
                placeholder="Họ"
                id="lastName"
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
            <div className="account-form-name">
              <label className="left-label" htmlFor="firstName">
                Tên
              </label>
              <input
                type="text"
                placeholder="Tên"
                id="firstName"
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
                <option value="">Ngày</option>
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
                <option value="">Tháng</option>
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
                <option value="">Năm</option>
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

          <div className="account-form-email">
            <label className="left-label" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              id="email"
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

          <div className="account-form-phone">
            <label className="left-label" htmlFor="phone">
              Số điện thoại
            </label>
            <input
              type="tel"
              placeholder="Số điện thoại"
              id="phone"
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

          <div className="account info-box">
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

          <button className="btn-submit">Cập nhật</button>
        </form>
      </div>
    </div>
  );
}
