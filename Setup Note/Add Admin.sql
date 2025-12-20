-- DROP DATABASE IF EXISTS applestore; 
-- Nếu db có vấn đề thì Clear bảng sau đó chạy file dump ban đầu(Dump20251217.sql) rồi chạy đoạn bên dưới 

USE applestore;

-- =========================================================
-- 1) FIX: Cho phép lưu ảnh base64 / data URI (không bị cắt cụt)
-- =========================================================
ALTER TABLE iphone MODIFY image LONGTEXT NOT NULL;
ALTER TABLE ipad   MODIFY image LONGTEXT NOT NULL;
ALTER TABLE mac    MODIFY image LONGTEXT NOT NULL;
ALTER TABLE watch  MODIFY image LONGTEXT NOT NULL;

-- =========================================================
-- 2) MIGRATION: Bổ sung cột admin cho client_account
--    (SQL ban đầu: phone TEXT, password VARCHAR(45) khá dễ thiếu)
-- =========================================================
ALTER TABLE client_account
  MODIFY phone VARCHAR(45) NOT NULL,
  MODIFY password VARCHAR(255) NOT NULL;

ALTER TABLE client_account
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user',
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Nếu bạn muốn enforce email unique (rất nên có cho login/admin)
-- Nếu đang có dữ liệu trùng email thì lệnh này sẽ báo lỗi -> chạy check ở phần "Kiểm tra" bên dưới trước.
ALTER TABLE client_account
  ADD UNIQUE KEY uk_client_email (email);

-- Tạo tài khoản admin (dùng email = 'admin' theo đúng hệ hiện tại của bạn)
-- Nếu bạn muốn an toàn hơn, dùng 'admin@local' và sửa phần login tương ứng.
INSERT INTO client_account (name, birthday, email, phone, password, role)
VALUES ('Admin', '2000-01-01', 'admin', '0000000000', '12345687', 'admin');

-- =========================================================
-- 3) FIX: watch.quantity đang là VARCHAR(45) trong SQL ban đầu
--    -> đổi về INT để các query/admin thao tác ổn định
-- =========================================================
ALTER TABLE watch
  MODIFY quantity INT NOT NULL;

-- =========================================================
-- 4) Đảm bảo bảng details tồn tại (vì các chức năng admin hay cần)
--    Không đổi tên sản phẩm hàng loạt để tránh làm lệch mapping frontend.
-- =========================================================
CREATE TABLE IF NOT EXISTS details (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  detail TEXT NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_details_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
