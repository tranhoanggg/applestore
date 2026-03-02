require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb" }));

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });

// Secret dùng để ký/kiểm tra adminToken (giữ tên biến môi trường cũ để tương thích)
const ADMIN_BOOTSTRAP_SECRET =
  process.env.ADMIN_BOOTSTRAP_SECRET || "change-me";

// Đảm bảo cột role tồn tại để phân quyền tài khoản
function ensureRoleColumn(callback = () => {}) {
  db.query("SHOW COLUMNS FROM client_account LIKE 'role'", (err, results) => {
    if (err) {
      console.error("Không thể kiểm tra cột role", err);
      return;
    }

    if (results.length === 0) {
      db.query(
        "ALTER TABLE client_account ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'",
        (alterErr) => {
          if (alterErr) {
            console.error("Không thể thêm cột role", alterErr);
            return;
          } else {
            console.log("Đã thêm cột role vào client_account");
            callback();
          }
        },
      );
    } else {
      callback();
    }
  });
}

ensureRoleColumn(() => ensureDefaultAdmin());

// Tạo sẵn tài khoản admin mặc định (an toàn khi chạy nhiều lần)
function ensureDefaultAdmin() {
  const defaultAdmin = {
    name: "Admin",
    birthday: "2000-01-01",
    email: "admin",
    phone: "0000000000",
    password: "12345687",
  };

  db.query(
    "SELECT id FROM client_account WHERE role = 'admin' OR email = ? LIMIT 1",
    [defaultAdmin.email],
    (err, results) => {
      if (err) {
        console.error("Không thể kiểm tra tài khoản admin mặc định", err);
        return;
      }

      if (results.length > 0) {
        return; // đã tồn tại, không thêm lại
      }

      db.query(
        `INSERT INTO client_account (name, birthday, email, phone, password, role)
         VALUES (?, ?, ?, ?, ?, 'admin')`,
        [
          defaultAdmin.name,
          defaultAdmin.birthday,
          defaultAdmin.email,
          defaultAdmin.phone,
          defaultAdmin.password,
        ],
        (insertErr) => {
          if (insertErr) {
            console.error("Không thể tạo admin mặc định", insertErr);
          } else {
            console.log("Đã tạo tài khoản admin mặc định (email: admin)");
          }
        },
      );
    },
  );
}

const PRODUCT_TABLES = {
  iphone: {
    table: "iphone",
    fields: [
      "name",
      "capacity",
      "color",
      "code",
      "price",
      "tag",
      "quantity",
      "image",
    ],
  },
  ipad: {
    table: "ipad",
    fields: [
      "name",
      "capacity",
      "color",
      "code",
      "price",
      "tag",
      "quantity",
      "image",
    ],
  },
  mac: {
    table: "mac",
    fields: [
      "name",
      "ram",
      "rom",
      "color",
      "code",
      "price",
      "tag",
      "quantity",
      "image",
    ],
  },
  watch: {
    table: "watch",
    fields: ["name", "color", "code", "price", "tag", "quantity", "image"],
  },
};

const TABLE_NAME_BY_TYPE = {
  Iphone: "iphone",
  Ipad: "ipad",
  Mac: "mac",
  Watch: "watch",
  Airpods: "airpods",
};

const ADMIN_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const ASSET_ROOT = path.join(__dirname, "../frontend/public/assets/images");

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const normalizeSegment = (value = "") =>
  value
    .toString()
    .trim()
    .replace(/[\\/]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, "");

const getTypeFolderName = (type) => {
  const lower = (type || "").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const detectExtension = (dataUri = "", fallback = "png") => {
  const match = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
  if (match && match[1]) {
    const ext = match[1].toLowerCase();
    if (["png", "jpg", "jpeg", "webp"].includes(ext))
      return ext === "jpg" ? "jpeg" : ext;
  }
  const nameExt = fallback.split(".").pop();
  return nameExt || "png";
};

const normalizeImageValue = (value) => {
  if (!value) return "";
  const trimmed = value.toString().trim();
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  if (/^\/?assets\//i.test(trimmed))
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalizeSegment(trimmed);
};

const extractFolderSegment = (folder = "") => {
  const trimmed = folder.toString().trim();
  if (!trimmed) return "";

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/").filter(Boolean);
    if (!parts.length) return "";
    const last = parts[parts.length - 1];
    const beforeLast = parts[parts.length - 2];
    if (/\.(png|jpe?g|webp)$/i.test(last) && beforeLast) {
      return beforeLast;
    }
    return last;
  }

  return trimmed;
};

const writeImagesToAssets = ({ type, name, folder, images = [] }) => {
  if (!images.length) return null;

  const safeType = getTypeFolderName(type);
  const safeName = normalizeSegment(name);
  const safeFolder = normalizeSegment(
    extractFolderSegment(folder) || "default",
  );

  if (!safeType || !safeName || !safeFolder) {
    return null;
  }

  const targetDir = path.join(ASSET_ROOT, safeType, safeName, safeFolder);
  ensureDir(targetDir);

  // clean old files for the folder to avoid stale images
  fs.readdirSync(targetDir).forEach((file) => {
    const full = path.join(targetDir, file);
    if (fs.statSync(full).isFile()) {
      fs.unlinkSync(full);
    }
  });

  images.forEach((img, idx) => {
    const data = typeof img === "string" ? img : img?.data;
    if (!data || !data.startsWith("data:image/")) return;
    const ext = detectExtension(data, img?.name || "png");
    const base64 = data.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(path.join(targetDir, `${idx + 1}.${ext}`), buffer);
  });

  // return db-friendly first image path
  const firstExt = detectExtension(
    images[0]?.data || images[0],
    images[0]?.name || "png",
  );
  return `/assets/images/${safeType}/${safeName}/${safeFolder}/1.${firstExt}`;
};

function createAdminToken(admin) {
  const payload = {
    id: admin.id,
    email: admin.email,
    issuedAt: Date.now(),
  };
  const serialized = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", ADMIN_BOOTSTRAP_SECRET)
    .update(serialized)
    .digest("hex");

  return `${Buffer.from(serialized).toString("base64url")}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  try {
    const payloadBuffer = Buffer.from(encodedPayload, "base64url");
    const serialized = payloadBuffer.toString();
    const expectedSignature = crypto
      .createHmac("sha256", ADMIN_BOOTSTRAP_SECRET)
      .update(serialized)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )
    ) {
      return null;
    }

    const payload = JSON.parse(serialized);
    if (Date.now() - payload.issuedAt > ADMIN_TOKEN_TTL_MS) {
      return null;
    }

    return payload;
  } catch (err) {
    console.error("Không thể xác thực admin token", err);
    return null;
  }
}

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring("Bearer ".length).trim()
    : null;

  const tokenData = verifyAdminToken(token);
  if (!tokenData) {
    return res.status(401).json({
      success: false,
      message: "Thiếu hoặc sai thông tin xác thực admin",
    });
  }

  db.query(
    "SELECT id, role, email FROM client_account WHERE id = ?",
    [tokenData.id],
    (err, results) => {
      if (err) {
        console.error("Không thể kiểm tra quyền admin", err);
        return res.status(500).json({ success: false });
      }

      const user = results[0];
      if (!user || user.role !== "admin") {
        return res
          .status(403)
          .json({ success: false, message: "Tài khoản không phải admin" });
      }

      req.admin = user;
      next();
    },
  );
};

app.get("/iphones", (req, res) => {
  db.query("SELECT * FROM iphone", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu iphone");
    }
    res.json(results);
  });
});

app.get("/iphone/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM iphone where id = ?", [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu iphone theo id");
    }
    res.json(results);
  });
});

app.get("/iphones/buy/:name", (req, res) => {
  const iphoneName = req.params.name;

  db.query(
    "SELECT * FROM iphone where name = ?",
    [iphoneName],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi lấy dữ liệu mua iphone");
      }
      res.json(results);
    },
  );
});

app.get("/ipads", (req, res) => {
  db.query("SELECT * FROM ipad", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu ipad");
    }
    res.json(results);
  });
});

app.get("/ipads/buy/:name", (req, res) => {
  const ipadName = req.params.name;

  db.query("SELECT * FROM ipad where name = ?", [ipadName], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu mua ipad");
    }
    res.json(results);
  });
});

app.get("/ipad/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM ipad where id = ?", [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu ipad theo id");
    }
    res.json(results);
  });
});

app.get("/macs", (req, res) => {
  db.query("SELECT * FROM mac", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu mac");
    }
    res.json(results);
  });
});

app.get("/macs/buy/:name", (req, res) => {
  const macName = req.params.name;

  db.query("SELECT * FROM mac where name = ?", [macName], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu mua mac");
    }
    res.json(results);
  });
});

app.get("/mac/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM mac where id = ?", [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu mac theo id");
    }
    res.json(results);
  });
});

app.get("/watchs", (req, res) => {
  db.query("SELECT * FROM watch", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu watch");
    }
    res.json(results);
  });
});

app.get("/watchs/buy/:name", (req, res) => {
  const watchName = req.params.name;

  db.query(
    "SELECT * FROM watch where name = ?",
    [watchName],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi lấy dữ liệu mua watch");
      }
      res.json(results);
    },
  );
});

app.get("/watch/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM watch where id = ?", [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu watch theo id");
    }
    res.json(results);
  });
});

app.get("/client_account", (req, res) => {
  db.query("SELECT * FROM client_account", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu client_account");
    }
    res.json(results);
  });
});

app.get("/client_account/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    "SELECT * FROM client_account where id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .send("Lỗi khi lấy dữ liệu client_account theo ID");
      }
      res.json(results);
    },
  );
});

app.put("/client_account/update", (req, res) => {
  const { id, name, birthday, email, phone } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Thiếu id người dùng",
    });
  }

  const sql = `
    UPDATE client_account
    SET 
      name = ?,
      birthday = ?,
      email = ?,
      phone = ?
    WHERE id = ?
  `;

  db.query(sql, [name, birthday, email, phone, id], (err, result) => {
    if (err) {
      console.error("Lỗi khi cập nhật người dùng:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thông tin người dùng",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
    });
  });
});

app.post("/client_account/password-reset/check", (req, res) => {
  const { id, current_password } = req.body;

  if (!id || !current_password) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin xác thực mật khẩu",
    });
  }

  db.query(
    "SELECT password FROM client_account WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("Lỗi khi kiểm tra mật khẩu người dùng:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi kiểm tra mật khẩu người dùng",
        });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      if (results[0].password !== current_password) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu chưa chính xác",
        });
      }

      return res.json({ success: true });
    },
  );
});

app.put("/client_account/password-reset", (req, res) => {
  const { id, new_password, current_password } = req.body;

  if (!id || !new_password || !current_password) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin đổi mật khẩu",
    });
  }

  db.query(
    "SELECT password FROM client_account WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("Lỗi khi kiểm tra mật khẩu hiện tại:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi kiểm tra mật khẩu hiện tại",
        });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      if (results[0].password !== current_password) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu hiện tại chưa chính xác",
        });
      }

      const sql = `
        UPDATE client_account
        SET
          password = ?
        WHERE id = ?
      `;

      db.query(sql, [new_password, id], (updateErr, result) => {
        if (updateErr) {
          console.error("Lỗi khi cập nhật mật khẩu người dùng:", updateErr);
          return res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật mật khẩu người dùng",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy người dùng",
          });
        }

        res.json({
          success: true,
          message: "Cập nhật mật khẩu thành công",
        });
      });
    },
  );
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Thiếu email hoặc mật khẩu",
    });
  }

  db.query(
    "SELECT id, name, birthday, email, phone, password, role FROM client_account WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("Không thể đăng nhập", err);
        return res.status(500).json({ success: false });
      }

      const user = results[0];
      if (!user || user.password !== password) {
        return res
          .status(401)
          .json({ success: false, message: "Email hoặc mật khẩu không đúng" });
      }

      const normalizedUser = { ...user, role: user.role || "user" };
      delete normalizedUser.password;

      const response = { success: true, user: normalizedUser };
      if (normalizedUser.role === "admin") {
        response.adminToken = createAdminToken(user);
      }

      res.json(response);
    },
  );
});

app.post("/signup", (req, res) => {
  const { name, birthday, email, phone, password } = req.body;

  const sql = `
    INSERT INTO client_account (name, birthday, email, phone, password, role)
    VALUES (?, ?, ?, ?, ?, 'user')
  `;

  db.query(sql, [name, birthday, email, phone, password], (err, result) => {
    if (err) {
      console.error("Lỗi khi thêm người dùng:", err);
      return res.status(500).send("Lỗi khi tạo tài khoản người dùng");
    }

    res.json({
      success: true,
      message: "Tạo tài khoản thành công!",
      userId: result.insertId,
    });
  });
});

app.post("/iphones/pay", (req, res) => {
  const {
    user_id,
    name,
    phone,
    product_id,
    product_type,
    color,
    capacity,
    address_detail,
    commune,
    district,
    city,
    date,
    payment_method,
    bank,
    payment_status,
  } = req.body;

  db.beginTransaction((err) => {
    if (err) {
      console.error("Begin transaction error", err);
      return res.status(500).json({ success: false });
    }

    const updateQuantitySql = `
      UPDATE iphone
      SET quantity = quantity - 1
      WHERE id = ? AND quantity > 0
    `;

    db.query(updateQuantitySql, [product_id], (err, result) => {
      if (err || result.affectedRows === 0) {
        return db.rollback(() => {
          console.error("Không đủ hàng hoặc lỗi update quantity", err);
          res.status(400).json({
            success: false,
            message: "Sản phẩm đã hết hàng",
          });
        });
      }

      const insertBillSql = `
        INSERT INTO bill (
          user_id, name, phone, product_id, product_type, color, capacity,
          address_detail, commune, district, city, date,
          payment_method, bank, payment_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertBillSql,
        [
          user_id,
          name,
          phone,
          product_id,
          product_type,
          color,
          capacity,
          address_detail,
          commune,
          district,
          city,
          date,
          payment_method,
          bank,
          payment_status,
        ],
        (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Insert bill error", err);
              res.status(500).json({
                success: false,
                message: "Không thể tạo đơn hàng",
              });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Commit error", err);
                res.status(500).json({ success: false });
              });
            }

            res.json({
              success: true,
            });
          });
        },
      );
    });
  });
});

app.post("/ipads/pay", (req, res) => {
  const {
    user_id,
    name,
    phone,
    product_id,
    product_type,
    color,
    capacity,
    address_detail,
    commune,
    district,
    city,
    date,
    payment_method,
    bank,
    payment_status,
  } = req.body;

  db.beginTransaction((err) => {
    if (err) {
      console.error("Begin transaction error", err);
      return res.status(500).json({ success: false });
    }

    const updateQuantitySql = `
      UPDATE ipad
      SET quantity = quantity - 1
      WHERE id = ? AND quantity > 0
    `;

    db.query(updateQuantitySql, [product_id], (err, result) => {
      if (err || result.affectedRows === 0) {
        return db.rollback(() => {
          console.error("Không đủ hàng hoặc lỗi update quantity", err);
          res.status(400).json({
            success: false,
            message: "Sản phẩm đã hết hàng",
          });
        });
      }

      const insertBillSql = `
        INSERT INTO bill (
          user_id, name, phone, product_id, product_type, color, capacity,
          address_detail, commune, district, city, date,
          payment_method, bank, payment_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertBillSql,
        [
          user_id,
          name,
          phone,
          product_id,
          product_type,
          color,
          capacity,
          address_detail,
          commune,
          district,
          city,
          date,
          payment_method,
          bank,
          payment_status,
        ],
        (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Insert bill error", err);
              res.status(500).json({
                success: false,
                message: "Không thể tạo đơn hàng",
              });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Commit error", err);
                res.status(500).json({ success: false });
              });
            }

            res.json({
              success: true,
            });
          });
        },
      );
    });
  });
});

app.post("/macs/pay", (req, res) => {
  const {
    user_id,
    name,
    phone,
    product_id,
    product_type,
    color,
    ram,
    rom,
    address_detail,
    commune,
    district,
    city,
    date,
    payment_method,
    bank,
    payment_status,
  } = req.body;

  db.beginTransaction((err) => {
    if (err) {
      console.error("Begin transaction error", err);
      return res.status(500).json({ success: false });
    }

    const updateQuantitySql = `
      UPDATE mac
      SET quantity = quantity - 1
      WHERE id = ? AND quantity > 0
    `;

    db.query(updateQuantitySql, [product_id], (err, result) => {
      if (err || result.affectedRows === 0) {
        return db.rollback(() => {
          console.error("Không đủ hàng hoặc lỗi update quantity", err);
          res.status(400).json({
            success: false,
            message: "Sản phẩm đã hết hàng",
          });
        });
      }

      const insertBillSql = `
        INSERT INTO bill (
          user_id, name, phone, product_id, product_type, color, ram, rom,
          address_detail, commune, district, city, date,
          payment_method, bank, payment_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertBillSql,
        [
          user_id,
          name,
          phone,
          product_id,
          product_type,
          color,
          ram,
          rom,
          address_detail,
          commune,
          district,
          city,
          date,
          payment_method,
          bank,
          payment_status,
        ],
        (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Insert bill error", err);
              res.status(500).json({
                success: false,
                message: "Không thể tạo đơn hàng",
              });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Commit error", err);
                res.status(500).json({ success: false });
              });
            }

            res.json({
              success: true,
            });
          });
        },
      );
    });
  });
});

app.post("/watchs/pay", (req, res) => {
  const {
    user_id,
    name,
    phone,
    product_id,
    product_type,
    color,
    address_detail,
    commune,
    district,
    city,
    date,
    payment_method,
    bank,
    payment_status,
  } = req.body;

  db.beginTransaction((err) => {
    if (err) {
      console.error("Begin transaction error", err);
      return res.status(500).json({ success: false });
    }

    const updateQuantitySql = `
      UPDATE watch
      SET quantity = quantity - 1
      WHERE id = ? AND quantity > 0
    `;

    db.query(updateQuantitySql, [product_id], (err, result) => {
      if (err || result.affectedRows === 0) {
        return db.rollback(() => {
          console.error("Không đủ hàng hoặc lỗi update quantity", err);
          res.status(400).json({
            success: false,
            message: "Sản phẩm đã hết hàng",
          });
        });
      }

      const insertBillSql = `
        INSERT INTO bill (
          user_id, name, phone, product_id, product_type,
          color, capacity, ram, rom,
          address_detail, commune, district, city, date,
          payment_method, bank, payment_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertBillSql,
        [
          user_id,
          name,
          phone,
          product_id,
          product_type,
          color,
          "", // capacity
          "", // ram
          "", // rom
          address_detail,
          commune,
          district,
          city,
          date,
          payment_method,
          bank,
          payment_status,
        ],
        (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Insert bill error", err);
              res.status(500).json({
                success: false,
                message: "Không thể tạo đơn hàng",
              });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Commit error", err);
                res.status(500).json({ success: false });
              });
            }

            res.json({
              success: true,
            });
          });
        },
      );
    });
  });
});

app.post("/add_to_cart", (req, res) => {
  const { user_id, product_id, type } = req.body;

  if (!user_id || !product_id || !type) {
    return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
  }

  // 1️⃣ Kiểm tra sản phẩm đã có trong giỏ chưa
  const checkSql = `
    SELECT id, quantity
    FROM cart
    WHERE user_id = ? AND product_id = ? AND type = ?
  `;

  db.query(checkSql, [user_id, product_id, type], (err, results) => {
    if (err) {
      console.error("Lỗi check cart", err);
      return res.status(500).json({ success: false });
    }

    if (results.length > 0) {
      const updateSql = `
        UPDATE cart
        SET quantity = quantity + 1
        WHERE id = ?
      `;

      db.query(updateSql, [results[0].id], (err) => {
        if (err) {
          console.error("Lỗi update cart", err);
          return res.status(500).json({ success: false });
        }

        return res.json({
          success: true,
          action: "updated",
        });
      });
    } else {
      const insertSql = `
        INSERT INTO cart (user_id, product_id, type, quantity)
        VALUES (?, ?, ?, 1)
      `;

      db.query(insertSql, [user_id, product_id, type], (err) => {
        if (err) {
          console.error("Lỗi insert cart", err);
          return res.status(500).json({ success: false });
        }

        return res.json({
          success: true,
          action: "inserted",
        });
      });
    }
  });
});

app.get("/cart/:id", (req, res) => {
  const user_id = req.params.id;

  db.query(
    "SELECT * FROM cart where user_id = ?",
    [user_id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi lấy dữ liệu cart theo ID");
      }
      res.json(results);
    },
  );
});

app.put("/cart/update-quantity", (req, res) => {
  const { user_id, product_id, type, action } = req.body;

  if (!user_id || !product_id || !type || !action) {
    return res.status(400).json({
      success: false,
      message: "Thiếu dữ liệu cần thiết",
    });
  }

  let sql = "";

  if (action === "increase") {
    sql = `
      UPDATE cart
      SET quantity = quantity + 1
      WHERE user_id = ? AND product_id = ? AND type = ?
    `;
  } else if (action === "decrease") {
    sql = `
      UPDATE cart
      SET quantity = quantity - 1
      WHERE user_id = ? AND product_id = ? AND type = ? AND quantity > 1
    `;
  } else {
    return res.status(400).json({
      success: false,
      message: "Action không hợp lệ",
    });
  }

  db.query(sql, [user_id, product_id, type], (err, result) => {
    if (err) {
      console.error("Lỗi update quantity", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: "Không thể cập nhật số lượng",
      });
    }

    res.json({
      success: true,
    });
  });
});

app.post("/cart/pay", (req, res) => {
  const {
    user_id,
    name,
    phone,
    payment_method,
    bank,
    payment_status,
    address_detail,
    commune,
    district,
    city,
    date,
    cartItems,
  } = req.body;

  if (!user_id || !cartItems?.length) {
    return res.status(400).json({
      success: false,
      message: "Thiếu dữ liệu thanh toán",
    });
  }

  const TABLE_MAP = {
    Iphone: "iphone",
    Ipad: "ipad",
    Mac: "mac",
    Watch: "watch",
  };

  db.beginTransaction((err) => {
    if (err) {
      console.error("Begin transaction error", err);
      return res.status(500).json({ success: false });
    }

    /* ===== 1. INSERT BILL ===== */
    const insertBillSql = `
      INSERT INTO bill (
        user_id,
        name,
        phone,
        product_type,
        color,
        capacity,
        ram,
        rom,
        address_detail,
        commune,
        district,
        city,
        date,
        payment_method,
        bank,
        payment_status
      )
      VALUES (?, ?, ?, '', '', '', '', '', ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertBillSql,
      [
        user_id,
        name,
        phone,
        address_detail,
        commune,
        district,
        city,
        date,
        payment_method,
        bank,
        payment_status,
      ],
      (err, billResult) => {
        if (err) {
          return db.rollback(() => {
            console.error("Insert bill error", err);
            res.status(500).json({ success: false });
          });
        }

        const bill_id = billResult.insertId;

        /* ===== 2. TRỪ KHO TỪNG SẢN PHẨM ===== */
        const deductStock = (index = 0) => {
          if (index >= cartItems.length) {
            return insertBillDetail();
          }

          const item = cartItems[index];
          const table = TABLE_MAP[item.type];

          if (!table) {
            return db.rollback(() => {
              res.status(400).json({
                success: false,
                message: "Loại sản phẩm không hợp lệ",
              });
            });
          }

          const updateStockSql = `
            UPDATE ${table}
            SET quantity = quantity - ?
            WHERE id = ? AND quantity >= ?
          `;

          db.query(
            updateStockSql,
            [item.quantity, item.product_id, item.quantity],
            (err, result) => {
              if (err || result.affectedRows === 0) {
                return db.rollback(() => {
                  res.status(400).json({
                    success: false,
                    message: "Sản phẩm không đủ hàng",
                  });
                });
              }

              deductStock(index + 1);
            },
          );
        };

        /* ===== 3. INSERT BILL_DETAIL ===== */
        const insertBillDetail = () => {
          const insertDetailSql = `
            INSERT INTO bill_detail (bill_id, product_id, quantity, type)
            VALUES ?
          `;

          const values = cartItems.map((item) => [
            bill_id,
            item.product_id,
            item.quantity,
            item.type,
          ]);

          db.query(insertDetailSql, [values], (err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Insert bill_detail error", err);
                res.status(500).json({ success: false });
              });
            }

            deleteCart();
          });
        };

        /* ===== 4. DELETE CART ===== */
        const deleteCart = () => {
          db.query("DELETE FROM cart WHERE user_id = ?", [user_id], (err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Delete cart error", err);
                res.status(500).json({ success: false });
              });
            }
            commitTransaction();
          });
        };

        /* ===== 5. COMMIT ===== */
        const commitTransaction = () => {
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Commit error", err);
                res.status(500).json({ success: false });
              });
            }

            res.json({
              success: true,
              bill_id,
            });
          });
        };

        deductStock(); // START
      },
    );
  });
});

app.put("/cart/delete-item", (req, res) => {
  const { user_id, product_id, type } = req.body;

  if (!user_id || !product_id || !type) {
    return res.status(400).json({
      success: false,
      message: "Thiếu dữ liệu xoá sản phẩm khỏi giỏ hàng",
    });
  }

  const sql = `
    DELETE FROM cart
    WHERE user_id = ? AND product_id = ? AND type = ?
  `;

  db.query(sql, [user_id, product_id, type], (err, result) => {
    if (err) {
      console.error("Lỗi khi xoá sản phẩm khỏi giỏ hàng:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi xoá sản phẩm khỏi giỏ hàng",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ hàng",
      });
    }

    res.json({
      success: true,
      message: "Xoá sản phẩm khỏi giỏ hàng thành công",
    });
  });
});

app.get("/bill/:id", (req, res) => {
  const user_id = req.params.id;

  db.query(
    "SELECT * FROM bill where user_id = ? ORDER BY date DESC, id DESC",
    [user_id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi lấy dữ liệu bill theo ID");
      }
      res.json(results);
    },
  );
});

app.get("/bill-detail/:id", (req, res) => {
  const bill_id = req.params.id;

  db.query(
    "SELECT * FROM bill_detail where bill_id = ?",
    [bill_id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Lỗi khi lấy dữ liệu bill_detail theo ID");
      }
      res.json(results);
    },
  );
});

app.get("/bill-full/:billId", async (req, res) => {
  const billId = req.params.billId;

  try {
    // Lấy bill
    const bill = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM bill WHERE id = ?", [billId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });

    if (!bill) {
      return res.status(404).json({ message: "Không tìm thấy bill" });
    }

    // Lấy bill_detail
    const billDetails = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM bill_detail WHERE bill_id = ?",
        [billId],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        },
      );
    });

    let items = [];

    if (billDetails.length > 0) {
      items = await Promise.all(
        billDetails.map((detail) => {
          const tableName = TABLE_NAME_BY_TYPE[detail.type];

          if (!tableName) {
            return { ...detail, product: null };
          }

          return new Promise((resolve, reject) => {
            db.query(
              `SELECT * FROM ${tableName} WHERE id = ?`,
              [detail.product_id],
              (err, productResult) => {
                if (err) return reject(err);

                resolve({
                  ...detail,
                  product: productResult[0] || null,
                });
              },
            );
          });
        }),
      );
    } else if (bill.product_id) {
      const tableName = TABLE_NAME_BY_TYPE[bill.product_type];

      if (tableName) {
        const product = await new Promise((resolve, reject) => {
          db.query(
            `SELECT * FROM ${tableName} WHERE id = ?`,
            [bill.product_id],
            (err, results) => {
              if (err) return reject(err);
              resolve(results[0] || null);
            },
          );
        });

        items = [
          {
            id: null,
            bill_id: bill.id,
            product_id: bill.product_id,
            type: bill.product_type,
            quantity: 1,
            product: product
              ? {
                  ...product,
                  color: bill.color,
                  capacity: bill.capacity,
                  ram: bill.ram,
                  rom: bill.rom,
                }
              : null,
          },
        ];
      }
    }

    // Response
    res.json({
      bill,
      items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy bill đầy đủ" });
  }
});

app.put("/bill/cancel/:billId", async (req, res) => {
  const billId = req.params.billId;

  try {
    // ===== 1. Lấy bill =====
    const bill = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM bill WHERE id = ?", [billId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });

    if (!bill) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (bill.payment_status !== "Đang chờ thanh toán") {
      return res.status(400).json({ message: "Đơn hàng không thể huỷ" });
    }

    // ===== 2. Lấy bill_detail =====
    const billDetails = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM bill_detail WHERE bill_id = ?",
        [billId],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        },
      );
    });

    // ===== 3. BEGIN TRANSACTION =====
    await new Promise((resolve, reject) =>
      db.query("START TRANSACTION", (err) => (err ? reject(err) : resolve())),
    );

    // ===================================
    // CASE 1: MUA QUA GIỎ HÀNG
    // ===================================
    if (billDetails.length > 0) {
      for (const item of billDetails) {
        const tableName = TABLE_NAME_BY_TYPE[item.type];
        if (!tableName) continue;

        await new Promise((resolve, reject) => {
          db.query(
            `UPDATE ${tableName} SET quantity = quantity + ? WHERE id = ?`,
            [item.quantity, item.product_id],
            (err) => (err ? reject(err) : resolve()),
          );
        });
      }
    }

    // ===================================
    // CASE 2: MUA NHANH
    // ===================================
    else if (bill.product_id) {
      const tableName = TABLE_NAME_BY_TYPE[bill.product_type];

      if (tableName) {
        await new Promise((resolve, reject) => {
          db.query(
            `UPDATE ${tableName} SET quantity = quantity + 1 WHERE id = ?`,
            [bill.product_id],
            (err) => (err ? reject(err) : resolve()),
          );
        });
      }
    }

    // ===== 4. Update trạng thái bill =====
    await new Promise((resolve, reject) => {
      db.query(
        `UPDATE bill 
         SET payment_status = 'Đã huỷ' 
         WHERE id = ?`,
        [billId],
        (err) => (err ? reject(err) : resolve()),
      );
    });

    // ===== 5. COMMIT =====
    await new Promise((resolve, reject) =>
      db.query("COMMIT", (err) => (err ? reject(err) : resolve())),
    );

    res.json({ success: true, message: "Huỷ đơn thành công" });
  } catch (err) {
    console.error(err);

    // ===== ROLLBACK =====
    await new Promise((resolve) => db.query("ROLLBACK", () => resolve()));

    res.status(500).json({ message: "Huỷ đơn thất bại" });
  }
});

app.post("/bill/re-order", (req, res) => {
  const {
    old_bill_id, // ID của đơn hàng cũ cần xoá để tạo lại
    user_id,
    name,
    phone,
    payment_method,
    bank,
    payment_status,
    address_detail,
    commune,
    district,
    city,
    date,
    cartItems,
  } = req.body;

  // Validate dữ liệu đầu vào
  if (!user_id || !cartItems?.length || !old_bill_id) {
    return res.status(400).json({
      success: false,
      message: "Thiếu dữ liệu mua lại (Cần old_bill_id, user_id, items)",
    });
  }

  const TABLE_MAP = {
    Iphone: "iphone",
    Ipad: "ipad",
    Mac: "mac",
    Watch: "watch",
  };

  db.beginTransaction((err) => {
    if (err) {
      console.error("Begin transaction error", err);
      return res.status(500).json({ success: false });
    }

    /* ===== 1. XOÁ BILL DETAIL CŨ ===== */
    const deleteOldBillDetailSql = "DELETE FROM bill_detail WHERE bill_id = ?";
    db.query(deleteOldBillDetailSql, [old_bill_id], (err) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error deleting old bill_detail", err);
          res
            .status(500)
            .json({ success: false, message: "Lỗi xoá chi tiết đơn cũ" });
        });
      }

      /* ===== 2. XOÁ BILL CŨ ===== */
      const deleteOldBillSql = "DELETE FROM bill WHERE id = ?";
      db.query(deleteOldBillSql, [old_bill_id], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error deleting old bill", err);
            res.status(500).json({ success: false, message: "Lỗi xoá đơn cũ" });
          });
        }

        // Sau khi xoá xong đơn cũ, tiến hành quy trình tạo đơn mới
        createNewBill();
      });
    });

    /* ===== HÀM TẠO ĐƠN MỚI (Tương tự logic pay cũ) ===== */
    const createNewBill = () => {
      const insertBillSql = `
        INSERT INTO bill (
          user_id, name, phone, product_type, color, capacity, ram, rom,
          address_detail, commune, district, city, date,
          payment_method, bank, payment_status
        )
        VALUES (?, ?, ?, '', '', '', '', '', ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertBillSql,
        [
          user_id,
          name,
          phone,
          address_detail,
          commune,
          district,
          city,
          date,
          payment_method,
          bank,
          payment_status,
        ],
        (err, billResult) => {
          if (err) {
            return db.rollback(() => {
              console.error("Insert new bill error", err);
              res.status(500).json({ success: false });
            });
          }

          const new_bill_id = billResult.insertId;

          /* ===== 3. TRỪ KHO (Giữ nguyên logic cũ) ===== */
          const deductStock = (index = 0) => {
            if (index >= cartItems.length) {
              return insertBillDetail(new_bill_id);
            }

            const item = cartItems[index];
            const table = TABLE_MAP[item.type];

            if (!table) {
              return db.rollback(() => {
                res.status(400).json({
                  success: false,
                  message: `Loại sản phẩm không hợp lệ: ${item.type}`,
                });
              });
            }

            const updateStockSql = `
              UPDATE ${table}
              SET quantity = quantity - ?
              WHERE id = ? AND quantity >= ?
            `;

            db.query(
              updateStockSql,
              [item.quantity, item.product_id, item.quantity],
              (err, result) => {
                if (err || result.affectedRows === 0) {
                  return db.rollback(() => {
                    res.status(400).json({
                      success: false,
                      message: `Sản phẩm ${item.product_id} (${item.type}) không đủ hàng`,
                    });
                  });
                }
                deductStock(index + 1);
              },
            );
          };

          /* ===== 4. INSERT BILL DETAIL MỚI ===== */
          const insertBillDetail = (billId) => {
            const insertDetailSql = `
              INSERT INTO bill_detail (bill_id, product_id, quantity, type)
              VALUES ?
            `;

            const values = cartItems.map((item) => [
              billId,
              item.product_id,
              item.quantity,
              item.type,
            ]);

            db.query(insertDetailSql, [values], (err) => {
              if (err) {
                return db.rollback(() => {
                  console.error("Insert bill_detail error", err);
                  res.status(500).json({ success: false });
                });
              }

              // KHÔNG GỌI deleteCart() Ở ĐÂY
              commitTransaction(billId);
            });
          };

          // Bắt đầu trừ kho
          deductStock();
        },
      );
    };

    /* ===== 5. COMMIT ===== */
    const commitTransaction = (finalBillId) => {
      db.commit((err) => {
        if (err) {
          return db.rollback(() => {
            console.error("Commit error", err);
            res.status(500).json({ success: false });
          });
        }

        res.json({
          success: true,
          message: "Mua lại thành công (đã thay thế đơn cũ)",
          bill_id: finalBillId,
        });
      });
    };
  });
});

app.get("/api/products/:type/:name/related", async (req, res) => {
  const { type, name } = req.params;

  // ... (đoạn validate type giữ nguyên) ...
  const allowedTables = ["iphone", "ipad", "mac", "watch"];
  if (!allowedTables.includes(type)) {
    return res.status(400).json({ message: "Invalid product type" });
  }

  try {
    const sql = `SELECT * FROM ${type} WHERE name != ?`;

    const [rows] = await db.promise().query(sql, [name]);

    // ... (đoạn xử lý lọc trùng giữ nguyên) ...
    const uniqueProducts = {};
    rows.forEach((row) => {
      if (!uniqueProducts[row.name]) {
        uniqueProducts[row.name] = row;
      }
    });

    const result = Object.values(uniqueProducts)
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);

    res.json(result);
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu email hoặc mật khẩu" });
  }

  db.query(
    "SELECT id, name, birthday, email, phone, role FROM client_account WHERE email = ? AND password = ?",
    [email, password],
    (err, results) => {
      if (err) {
        console.error("Không thể đăng nhập admin", err);
        return res.status(500).json({ success: false });
      }

      const user = results[0];
      if (!user || user.role !== "admin") {
        return res.status(401).json({
          success: false,
          message: "Thông tin đăng nhập không hợp lệ",
        });
      }

      const token = createAdminToken(user);
      res.json({
        success: true,
        token,
        user: { ...user, role: user.role || "admin" },
      });
    },
  );
});

app.get("/admin/bills", requireAdmin, async (req, res) => {
  try {
    const bills = await queryAsync(
      "SELECT * FROM bill ORDER BY date DESC, id DESC",
    );

    const billsWithItems = await Promise.all(
      bills.map(async (bill) => {
        const details = await queryAsync(
          "SELECT * FROM bill_detail WHERE bill_id = ?",
          [bill.id],
        );

        const items = [];
        const attachProduct = async (type, productId, quantity = 1) => {
          const tableName = TABLE_NAME_BY_TYPE[type];
          if (!tableName || !productId) return;

          try {
            const productRows = await queryAsync(
              `SELECT name FROM ${tableName} WHERE id = ?`,
              [productId],
            );
            items.push({
              product_id: productId,
              type,
              quantity,
              name: productRows[0]?.name || "",
            });
          } catch (err) {
            console.error("Không thể lấy thông tin sản phẩm", err);
          }
        };

        if (bill.product_id && bill.product_type) {
          await attachProduct(bill.product_type, bill.product_id, 1);
        }

        for (const detail of details) {
          await attachProduct(detail.type, detail.product_id, detail.quantity);
        }

        return { ...bill, items };
      }),
    );

    res.json(billsWithItems);
  } catch (err) {
    console.error("Không thể lấy danh sách đơn hàng", err);
    res.status(500).json({ success: false });
  }
});

app.put("/admin/bill/approve/:billId", requireAdmin, (req, res) => {
  const billId = req.params.billId;

  db.query(
    "UPDATE bill SET payment_status = 'Thành công' WHERE id = ?",
    [billId],
    (err, result) => {
      if (err) {
        console.error("Không thể cập nhật trạng thái đơn", err);
        return res.status(500).json({ success: false });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy đơn hàng" });
      }

      res.json({ success: true, message: "Đã duyệt đơn hàng" });
    },
  );
});

app.post("/admin/products/:type", requireAdmin, (req, res) => {
  const type = req.params.type.toLowerCase();
  const config = PRODUCT_TABLES[type];

  if (!config) {
    return res
      .status(400)
      .json({ success: false, message: "Loại sản phẩm không hợp lệ" });
  }

  const missing = config.fields.filter((f) => req.body[f] === undefined);
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Thiếu thông tin: ${missing.join(", ")}`,
    });
  }

  const payload = {};
  config.fields.forEach((f) => (payload[f] = req.body[f]));

  if (Array.isArray(req.body.images) && req.body.images.length) {
    const savedPath = writeImagesToAssets({
      type,
      name: req.body.name,
      folder: req.body.image || req.body.color,
      images: req.body.images,
    });

    if (savedPath) {
      payload.image = savedPath;
    }
  } else if (payload.image) {
    payload.image = normalizeImageValue(payload.image);
  }

  db.query(`INSERT INTO ${config.table} SET ?`, payload, (err, result) => {
    if (err) {
      console.error("Không thể thêm sản phẩm", err);
      return res.status(500).json({ success: false });
    }

    res.json({ success: true, id: result.insertId });
  });
});

app.put("/admin/products/:type/:id", requireAdmin, (req, res) => {
  const type = req.params.type.toLowerCase();
  const config = PRODUCT_TABLES[type];
  const id = req.params.id;

  if (!config) {
    return res
      .status(400)
      .json({ success: false, message: "Loại sản phẩm không hợp lệ" });
  }

  const payload = {};
  config.fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      payload[f] = req.body[f];
    }
  });

  if (Array.isArray(req.body.images) && req.body.images.length) {
    const savedPath = writeImagesToAssets({
      type,
      name: req.body.name || payload.name,
      folder:
        req.body.image || req.body.color || payload.image || payload.color,
      images: req.body.images,
    });

    if (savedPath) {
      payload.image = savedPath;
    }
  } else if (payload.image) {
    payload.image = normalizeImageValue(payload.image);
  }

  if (Object.keys(payload).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Không có dữ liệu cập nhật" });
  }

  db.query(
    `UPDATE ${config.table} SET ? WHERE id = ?`,
    [payload, id],
    (err, result) => {
      if (err) {
        console.error("Không thể cập nhật sản phẩm", err);
        return res.status(500).json({ success: false });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }

      res.json({ success: true });
    },
  );
});

app.delete("/admin/products/:type/:id", requireAdmin, (req, res) => {
  const type = req.params.type.toLowerCase();
  const config = PRODUCT_TABLES[type];
  const id = req.params.id;

  if (!config) {
    return res
      .status(400)
      .json({ success: false, message: "Loại sản phẩm không hợp lệ" });
  }

  db.query(`DELETE FROM ${config.table} WHERE id = ?`, [id], (err, result) => {
    if (err) {
      console.error("Không thể xóa sản phẩm", err);
      return res.status(500).json({ success: false });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    res.json({ success: true });
  });
});

app.put("/admin/users/:id/role", requireAdmin, (req, res) => {
  const { role } = req.body;
  const { id } = req.params;
  const allowedRoles = ["user", "admin"];

  if (!allowedRoles.includes(role)) {
    return res
      .status(400)
      .json({ success: false, message: "Role không hợp lệ" });
  }

  db.query(
    "UPDATE client_account SET role = ? WHERE id = ?",
    [role, id],
    (err, result) => {
      if (err) {
        console.error("Không thể cập nhật role người dùng", err);
        return res.status(500).json({ success: false });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy người dùng" });
      }

      res.json({ success: true });
    },
  );
});

app.get("/details/:name", (req, res) => {
  const name = req.params.name;

  db.query("SELECT * FROM details where name = ?", [name], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Lỗi khi lấy dữ liệu details");
    }
    res.json(results);
  });
});

app.post("/admin/users/:id/ban", requireAdmin, (req, res) => {
  const clientId = req.params.id; // Lấy ID từ URL
  const { duration, reason } = req.body; // Lấy dữ liệu từ body

  // 1. Validate
  if (!clientId || !duration) {
    return res.status(400).json({
      success: false,
      message: "Thiếu ID người dùng hoặc thời gian cấm.",
    });
  }

  // 2. Bảo mật: Không cho admin ban chính mình
  // (Lưu ý: đảm bảo client_account có cột role và requireAdmin đã gán req.admin)
  if (req.admin && req.admin.id == clientId) {
    return res.status(400).json({
      success: false,
      message: "Bạn không thể tự cấm chính mình!",
    });
  }

  // 3. Tính toán thời gian mở khoá (banned_until)
  let bannedUntil;

  if (duration === "permanent") {
    // Nếu là vĩnh viễn, set năm 9999
    bannedUntil = new Date("9999-12-31 23:59:59");
  } else {
    // Nếu là giờ, cộng thêm vào thời gian hiện tại
    // duration từ frontend gửi lên là GIỜ (hours)
    const hoursToAdd = parseInt(duration);
    bannedUntil = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);
  }

  // 4. Update Database
  const sql = `
    UPDATE client_account 
    SET banned_until = ?, ban_reason = ? 
    WHERE id = ?
  `;

  db.query(sql, [bannedUntil, reason, clientId], (err, result) => {
    if (err) {
      console.error("Lỗi khi ban user:", err);
      return res.status(500).json({ success: false, message: "Lỗi Server" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng.",
      });
    }

    res.json({
      success: true,
      message: `Đã cấm người dùng ID ${clientId} thành công.`,
      banned_until: bannedUntil,
    });
  });
});

app.put("/admin/users/:id/unban", requireAdmin, (req, res) => {
  const clientId = req.params.id; // Lấy ID từ URL

  if (!clientId) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu ID người dùng" });
  }

  // Set banned_until và ban_reason về NULL
  const sql = `
    UPDATE client_account 
    SET banned_until = NULL, ban_reason = NULL 
    WHERE id = ?
  `;

  db.query(sql, [clientId], (err, result) => {
    if (err) {
      console.error("Lỗi khi unban:", err);
      return res.status(500).json({ success: false, message: "Lỗi Server" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng.",
      });
    }

    res.json({
      success: true,
      message: `Đã gỡ cấm cho tài khoản ID ${clientId}.`,
    });
  });
});

// --- API GHI NHẬN HÀNH VI (LOGGING) ---
app.post("/api/log-behavior", (req, res) => {
  const { user_identifier, action_type, action_detail } = req.body;

  // Lấy IP nếu user_identifier không được gửi lên (fallback)
  const userIp =
    user_identifier ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  const sql =
    "INSERT INTO user_logs (user_identifier, action_type, action_detail) VALUES (?, ?, ?)";
  db.query(sql, [userIp, action_type, action_detail], (err, result) => {
    if (err) {
      console.error("Lỗi ghi log:", err);
      return res.status(500).json({ error: "Lỗi Server" });
    }
    res.json({ success: true });
  });
});

// --- API THỐNG KÊ HÀNH VI (CHO DASHBOARD) ---
app.get("/api/log-stats", (req, res) => {
  // Query 1: Lấy danh sách chi tiết (giới hạn 50 dòng mới nhất)
  const sqlLogs = "SELECT * FROM user_logs ORDER BY created_at DESC LIMIT 50";

  // Query 2: Thống kê số lượng theo loại hành vi
  const sqlStats =
    "SELECT action_type, COUNT(*) as count FROM user_logs GROUP BY action_type";

  db.query(sqlLogs, (err, logs) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(sqlStats, (err2, stats) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ logs, stats });
    });
  });
});

app.get("/api/ratings/:productName", (req, res) => {
  const { productName } = req.params;
  const userId = req.headers["x-user-id"];

  const sqlStats = `
    SELECT 
      COUNT(*) as total_count, 
      AVG(rating) as average_rating 
    FROM product_ratings 
    WHERE product_name = ?
  `;

  const sqlMyRating = `
    SELECT rating, comment FROM product_ratings 
    WHERE product_name = ? AND user_id = ?
  `;

  db.query(sqlStats, [productName], (err, stats) => {
    if (err) return res.status(500).json({ error: "Lỗi Server" });

    const result = {
      total_count: stats[0].total_count || 0,
      average_rating: parseFloat(stats[0].average_rating || 0).toFixed(1),
      my_rating: null,
    };

    if (userId) {
      db.query(sqlMyRating, [productName, userId], (err2, myRate) => {
        if (!err2 && myRate.length > 0) {
          result.my_rating = myRate[0];
        }
        res.json(result);
      });
    } else {
      res.json(result);
    }
  });
});

app.post("/api/ratings", (req, res) => {
  const { user_id, product_name, rating, comment } = req.body;

  if (!user_id) return res.status(401).json({ message: "Vui lòng đăng nhập!" });
  if (rating < 1 || rating > 5)
    return res.status(400).json({ message: "Điểm sao không hợp lệ" });

  const sql = `
    INSERT INTO product_ratings (user_id, product_name, rating, comment) 
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [user_id, product_name, rating, comment], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ message: "Bạn đã đánh giá sản phẩm này rồi." });
      }
      console.error(err);
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }
    res.json({ success: true, message: "Đánh giá thành công!" });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại port ${PORT}`);
});
