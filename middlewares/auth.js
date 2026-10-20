import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Periksa format Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      code: "TOKEN_MISSING",
      error: "Token tidak ditemukan",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      code: "TOKEN_MISSING",
      error: "Token tidak ditemukan",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET belum dikonfigurasi");

    return res.status(500).json({
      code: "SERVER_CONFIG_ERROR",
      error: "Konfigurasi autentikasi server bermasalah",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        code: "TOKEN_EXPIRED",
        error: "Sesi login telah berakhir. Silakan login kembali.",
      });
    }

    if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
      return res.status(403).json({
        code: "TOKEN_INVALID",
        error: "Token tidak valid",
      });
    }

    console.error("JWT verification error:", err);

    return res.status(500).json({
      code: "AUTH_ERROR",
      error: "Terjadi kesalahan autentikasi",
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: "AUTH_REQUIRED",
      error: "Autentikasi diperlukan",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      code: "ADMIN_REQUIRED",
      error: "Hanya admin yang bisa mengakses",
    });
  }

  return next();
};
