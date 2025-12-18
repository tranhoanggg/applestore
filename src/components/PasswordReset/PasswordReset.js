import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PasswordReset.css";

export default function PasswordReset() {
  const navigate = useNavigate();
  const client = JSON.parse(localStorage.getItem("client") || "{}");

  const [form, setForm] = useState({
    password: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [checked, setChecked] = useState(false);

  const [errors, setErrors] = useState({
    passwordEmpty: false,
    passwordWrong: false,
    newPasswordEmpty: false,
    confirmEmpty: false,
    confirmMismatch: false,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================== KIỂM TRA PASSWORD HIỆN TẠI ================== */
  const handleCheckPassword = () => {
    if (!form.password) {
      setErrors({
        passwordEmpty: true,
        passwordWrong: false,
      });
      return;
    }

    if (form.password !== client.password) {
      setErrors({
        passwordEmpty: false,
        passwordWrong: true,
      });
      return;
    }

    // ✅ đúng password
    setErrors({});
    setChecked(true);
  };

  /* ================== SUBMIT ================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      newPasswordEmpty: !form.newPassword,
      confirmEmpty: !form.confirmPassword,
      confirmMismatch:
        form.newPassword &&
        form.confirmPassword &&
        form.newPassword !== form.confirmPassword,
    };

    setErrors(newErrors);

    if (
      newErrors.newPasswordEmpty ||
      newErrors.confirmEmpty ||
      newErrors.confirmMismatch
    )
      return;

    try {
      const res = await fetch(
        "http://localhost:5000/client_account/password-reset",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: client.id,
            new_password: form.newPassword,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Đã đổi mật khẩu thành công");

        // reload user
        const refreshed = await fetch(
          `http://localhost:5000/client_account/${client.id}`
        ).then((res) => res.json());

        localStorage.setItem("client", JSON.stringify(refreshed[0]));

        setForm({
          password: "",
          newPassword: "",
          confirmPassword: "",
        });
        setChecked(false);
      }
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  return (
    <div className="password-reset-page">
      <div className="password-reset-navbar">
        <div className="heading">Tài khoản Apple</div>
        <div className="option-container">
          <div
            className="option option-active"
            onClick={() => navigate("/login")}
          >
            Đổi mật khẩu
          </div>
          <div className="option" onClick={() => navigate("/account")}>
            Thông tin tài khoản
          </div>
        </div>
      </div>

      <div className="password-reset-container">
        <form className="password-reset-form" onSubmit={handleSubmit}>
          {/* PASSWORD HIỆN TẠI */}
          <div className="password-reset-form-password">
            <label className="left-label" htmlFor="password">
              Mật khẩu hiện tại
            </label>
            <div className="password-container">
              <input
                type="password"
                id="password"
                className="input full"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="button_check"
                onClick={handleCheckPassword}
              >
                Kiểm tra
              </button>
            </div>

            {errors.passwordEmpty && (
              <div className="input-warning password">
                <img src={require("../../assets/images/warning.png")} alt="" />
                Nhập mật khẩu của bạn.
              </div>
            )}

            {errors.passwordWrong && (
              <div className="input-warning password-error">
                <img src={require("../../assets/images/warning.png")} alt="" />
                Mật khẩu chưa chính xác.
              </div>
            )}
          </div>

          {/* PASSWORD MỚI */}
          <div className="password-reset-form-new-password">
            <label className="left-label" htmlFor="newPassword">
              Mật khẩu mới
            </label>
            <input
              type="password"
              id="newPassword"
              className="input full"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              disabled={!checked}
            />

            {errors.newPasswordEmpty && (
              <div className=" password-reset input-warning password">
                <img src={require("../../assets/images/warning.png")} alt="" />
                Nhập mật khẩu mới của bạn.
              </div>
            )}
          </div>

          {/* CONFIRM */}
          <div className="password-reset-form-password-confirm">
            <label className="left-label" htmlFor="password-confirm">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              id="password-confirm"
              className="input full"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={!checked}
            />

            {errors.confirmEmpty && (
              <div className="password-reset input-warning password-confirm-1">
                <img src={require("../../assets/images/warning.png")} alt="" />
                Hãy xác nhận mật khẩu mới của bạn.
              </div>
            )}

            {errors.confirmMismatch && (
              <div className="password-reset input-warning password-confirm-2">
                <img src={require("../../assets/images/warning.png")} alt="" />
                Mật khẩu xác nhận chưa khớp.
              </div>
            )}
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

          <button className="btn-submit" disabled={!checked}>
            Cập nhật
          </button>
        </form>
      </div>
    </div>
  );
}
