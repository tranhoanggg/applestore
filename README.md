# Apple Store Web

Ứng dụng gồm **frontend (React)** và **backend (Express + MySQL)**. Dưới đây là hướng dẫn chạy và cách cấp quyền admin để sử dụng bảng điều khiển.

## Cài đặt & khởi chạy
1. Cài phụ thuộc chung (để chạy song song front/back):
   ```bash
   npm install
   ```
2. Backend:
   ```bash
   cd backend
   npm install
   npm start   # lắng nghe ở http://localhost:5000
   ```
3. Frontend:
   ```bash
   cd frontend
   npm install
   npm start   # CRA mặc định http://localhost:3000
   ```
4. Chạy cả hai từ thư mục gốc:
   ```bash
   npm run start
   ```

## Cơ sở dữ liệu
* Import dữ liệu mẫu ban đầu: `Setup Note/Dump20251217.sql` (tạo DB `applestore`, kèm cột `role`, bảng `details`).
* Sau khi import, chạy tiếp `Setup Note/Add Admin.sql` để mở rộng db cho các chức năng admin
* Cập nhật thông tin kết nối trong `backend/db.js` (host/user/password/database) trước khi chạy.
* Khi server khởi động sẽ tự thêm cột `role` (mặc định `user`) vào bảng `client_account` nếu chưa có.

## Quyền admin & các cách nâng cấp tài khoản
### 1) Tài khoản admin mặc định (ít an toàn)
* Khi backend khởi động, nếu chưa có admin, hệ thống sẽ tự tạo tài khoản:
  * Email/username: `admin`
  * Mật khẩu: `12345687`
* Đây là cách nhanh nhất để có quyền admin nhưng cực kỳ rủi ro nếu không đổi mật khẩu ngay. Sau khi đăng nhập lần đầu, hãy đổi mật khẩu trong tab **Quyền truy cập** hoặc cập nhật trực tiếp trong DB.

### 2) Đổi role trực tiếp trong DB hoặc từ tài khoản admin
* Nếu có quyền truy cập cơ sở dữ liệu (hoặc thông qua công cụ DB admin), bạn có thể cập nhật `client_account.role` thành `admin` cho user mong muốn. Đây là phương án khẩn cấp khi mất quyền truy cập giao diện, nhưng cần kiểm soát chặt quyền truy cập DB.
* Khi đã có một admin đăng nhập, có thể dùng tab **Quyền truy cập** để chuyển role `user` ⇄ `admin` cho tài khoản khác (ngoại trừ chính bạn).

### Đăng nhập & token admin
* API đăng nhập chung: `POST /login` (body: `{ email, password }`).
  * Trả về thông tin người dùng và, nếu tài khoản là admin, kèm `adminToken` để gọi các API quản trị (token được ký bằng `ADMIN_BOOTSTRAP_SECRET` trong `.env`, hãy đặt giá trị mạnh để tránh giả mạo token).
* Trang Admin tự động yêu cầu token này; nếu hết hạn/thiếu token hệ thống sẽ chuyển về trang đăng nhập.


## Quản trị sản phẩm & đơn hàng
* Tab **Sản phẩm**: chọn loại (iPhone/iPad/Mac/Watch), thêm/sửa/xóa với form động theo trường của từng loại. Bạn có thể:
  * Chọn ảnh bằng ô browse (ảnh được lưu dưới dạng base64 hoặc đường dẫn), xem trước và thay đổi nhiều lần.
  * Chọn mã màu bằng bộ chọn màu (HEX) cho trường `code`.
  * Tìm kiếm theo tên/mã/màu sản phẩm trong bảng.
* Tab **Đơn hàng**: hiển thị danh sách sản phẩm người dùng mua (bao gồm đơn từ giỏ hàng), cho phép tìm kiếm và duyệt đơn ở trạng thái `Đang chờ thanh toán` (chuyển thành công).
* Tab **Quyền truy cập**: lọc người dùng bằng ô tìm kiếm rồi cấp/gỡ quyền trực tiếp trong bảng (không còn ô nhập ID/email riêng).

## Lưu ý cảnh báo build
* Thư viện `@mediapipe/tasks-vision` thiếu file source map nên Webpack có thể cảnh báo; đây là cảnh báo vô hại khi chạy dev.


# Chi tiết các thay đổi(xem ở commit gần nhất sau Init 3)
## Server.js
### 1) Cấu hình & tiện ích khởi tạo
* Thêm `dotenv` để đọc biến môi trường từ `.env`.
* Tăng giới hạn body JSON: `express.json({ limit: "30mb" })` (phục vụ upload ảnh dạng base64 từ admin).
* Bổ sung các module hỗ trợ:
  * `fs`, `path`: xử lý/lưu ảnh vào thư mục assets của frontend.
  * `crypto`: ký và xác thực token admin.
* Thêm helper `queryAsync(sql, params)` để dùng `Promise/async` khi truy vấn DB (được dùng trong một số API admin).

### 2) Phân quyền role & admin mặc định
* Tự động đảm bảo cột `client_account.role` tồn tại:
  * Nếu chưa có cột `role` thì chạy `ALTER TABLE ... ADD COLUMN role ... DEFAULT 'user'`.
* Tự động tạo tài khoản admin mặc định nếu hệ thống chưa có admin:
  * Email/username: `admin`
  * Mật khẩu: `12345687`
  * Role: `admin`

### 3) Đăng nhập & token admin
* Thêm API đăng nhập chung: `POST /login`
  * Trả về `user` (đã bỏ trường `password` khỏi response).
  * Nếu user có `role = 'admin'` sẽ trả thêm `adminToken`.
* Thêm cơ chế token admin (HMAC):
  * Secret ký token: `ADMIN_BOOTSTRAP_SECRET` (đọc từ `.env`).
  * TTL token: 24 giờ.
* Thêm middleware `requireAdmin`:
  * Đọc token từ `Authorization: Bearer <token>`.
  * Xác thực token + kiểm tra DB `client_account.role = 'admin'` trước khi cho phép gọi `/admin/*`.

### 4) Chuẩn hoá mapping loại sản phẩm & bảng DB
* Thêm `PRODUCT_TABLES` để cấu hình theo từng loại (`iphone`, `ipad`, `mac`, `watch`):
  * Mỗi loại gồm `table` + danh sách `fields` dùng cho CRUD admin.
* Thêm `TABLE_NAME_BY_TYPE` để map `Iphone/Ipad/Mac/Watch/Airpods` -> tên bảng DB tương ứng.
  * Được dùng lại trong các API xử lý bill (vd: `bill-full`, `bill-cancel`) và trong admin bills.

### 5) Xử lý ảnh sản phẩm (Admin CRUD)
* Hỗ trợ gửi ảnh dạng base64 từ frontend admin qua field `images`.
* Backend lưu ảnh vào thư mục assets:
  * `frontend/public/assets/images/<Type>/<Name>/<Folder>/`
  * Trả về đường dẫn lưu DB: `/assets/images/.../1.<ext>`
* Có cơ chế chuẩn hoá và làm sạch:
  * Chuẩn hoá `type/name/folder` để tránh ký tự nguy hiểm và đồng nhất cấu trúc thư mục.
  * Xoá ảnh cũ trong folder trước khi ghi ảnh mới để tránh ảnh rác/ảnh stale.
* Chuẩn hoá giá trị `image` nếu không upload:
  * Giữ nguyên nếu là `http(s)`, `data:`, `blob:`.
  * Tự chuẩn hoá nếu là `/assets/...` hoặc chuỗi key/path cũ.

### 6) Điều chỉnh luồng đổi mật khẩu (an toàn hơn so với bản cũ)
* Thêm API: `POST /client_account/password-reset/check`
  * Kiểm tra `current_password` trước khi cho phép đổi.
* Cập nhật API: `PUT /client_account/password-reset`
  * Bắt buộc có `id`, `current_password`, `new_password`.
  * Xác thực mật khẩu hiện tại rồi mới cập nhật mật khẩu mới.

### 7) Sửa insert bill cho Watch để khớp schema
* Ở `POST /watchs/pay`:
  * Bổ sung các cột `capacity`, `ram`, `rom` vào câu lệnh insert bill (đồng nhất schema).
  * Gán giá trị rỗng `""` cho `capacity/ram/rom` vì Watch không dùng các trường này.

### 8) Bổ sung hệ thống API quản trị (Admin APIs)
* Thêm `POST /admin/login` (đăng nhập admin riêng, trả về `token`).
* Quản lý đơn hàng:
  * `GET /admin/bills` (lấy toàn bộ bill + gắn thông tin item tối thiểu để hiển thị).
  * `PUT /admin/bill/approve/:billId` (duyệt đơn: set `payment_status = 'Thành công'`).
* CRUD sản phẩm theo loại:
  * `POST /admin/products/:type`
  * `PUT /admin/products/:type/:id`
  * `DELETE /admin/products/:type/:id`
* Quản lý quyền user:
  * `PUT /admin/users/:id/role` (chuyển role `user` ⇄ `admin` theo whitelist).

## Sửa lỗi từ trước đó(28/12/2025):
* Các trang detail đã được sửa để không còn navigate cố định về `/buyPhone`.
* Điều hướng từ detail đã được cập nhật để đi đúng route mua tương ứng theo từng loại sản phẩm (`/buy<Mac/Ipad/...>`).

## Thêm Add Admin.sql
* Thêm file `Add Admin.sql`.
* Script dùng để thêm quan hệ/bảng phục vụ phần admin.

## Thêm utils\image.js
* Thêm file `utils\image.js`.
* Thống nhất/chuẩn hóa việc gọi và trả về `image`.

## Chuẩn hóa việc gọi image với utils\image.js (hàm resolveProductImage)
* Chuẩn hóa việc resolve `image` thông qua `resolveProductImage`.
* Áp dụng tại:
  * Các trang Detail, List, Page, Buy (ipad, phone, mac, watch)
  * `CheckoutSummary`

## Sửa 1 số chỗ:
* Password reset
* Navbar
* Login
* Thêm route ở `AppContent.js`

## Thêm giao diện admin:
* Thêm giao diện admin trong `src\components\Admin`.

## Những vấn đề tồn đọng:
* Admin hiện tại chỉ thêm được 1 ảnh khi thêm sản phẩm.
* Tài khoản admin (mặc định) ở một số lúc khi thao tác với cart có thể sinh ra lỗi (khả năng do dữ liệu mismatch, chưa thấy xảy ra với tài khoản được nâng quyền).
