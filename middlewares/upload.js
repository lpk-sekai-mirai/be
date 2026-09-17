// middleware/upload.js
import multer from "multer";
import sharp from "sharp";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Konfigurasi Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Batas ukuran target (5 MB)
const MAX_SIZE = 5 * 1024 * 1024;

// Gunakan memory storage agar buffer bisa diolah Sharp dulu
const storage = multer.memoryStorage();

// Filter hanya gambar
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extName = allowedTypes.test(file.originalname.toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(
      new Error("Hanya file gambar (jpg, jpeg, png, webp, gif) yang diizinkan"),
      false
    );
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // naikkan limit ke 20 MB
});

// ===== Fungsi kompres gambar agar <= 5 MB =====
const compressImage = async (buffer, mimetype) => {
  // Kalau sudah <= 5 MB, langsung kembalikan tanpa diubah
  if (buffer.length <= MAX_SIZE) {
    return { buffer, mimetype };
  }

  // Jika GIF, hanya resize (hindari hilangnya animasi)
  if (mimetype === "image/gif") {
    let width = 1920;
    let output = buffer;
    const gifSharp = sharp(buffer, { animated: true });

    while (output.length > MAX_SIZE && width > 320) {
      output = await gifSharp
        .clone()
        .resize({ width, withoutEnlargement: true })
        .gif({ quality: 80 })
        .toBuffer();
      width = Math.floor(width * 0.8);
    }
    return { buffer: output, mimetype: "image/gif" };
  }

  // Untuk JPEG/PNG/WebP → konversi ke WebP dengan quality adaptif
  const base = sharp(buffer).rotate(); // auto-rotate dari EXIF
  let outputBuffer;
  let outputMime = "image/webp";

  // Tahap 1: turunkan quality dulu
  for (let q = 85; q >= 30; q -= 5) {
    outputBuffer = await base.clone().webp({ quality: q }).toBuffer();
    if (outputBuffer.length <= MAX_SIZE) {
      return { buffer: outputBuffer, mimetype: outputMime };
    }
  }

  // Tahap 2: kalau masih > 5MB, turunkan resolusi bertahap
  let width = 1920;
  while (outputBuffer.length > MAX_SIZE && width > 320) {
    outputBuffer = await base
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    width = Math.floor(width * 0.8);
  }

  return { buffer: outputBuffer, mimetype: outputMime };
};

// ===== Upload buffer ke Cloudinary via stream =====
const uploadBufferToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "student-photos",
        resource_type: "image",
        // Transformasi delivery (ukuran & kualitas akhir di CDN)
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// ===== Proses satu file =====
const processFile = async (file) => {
  const { buffer, mimetype } = await compressImage(file.buffer, file.mimetype);

  const result = await uploadBufferToCloudinary(buffer);

  // Simulasi property req.file.path seperti CloudinaryStorage sebelumnya
  file.path = result.secure_url;
  file.filename = result.public_id;
  file.size = buffer.length;
  file.mimetype = mimetype;
};

// ===== Middleware utama (setelah multer parsing) =====
const processAndUpload = async (req, res, next) => {
  try {
    if (req.file) {
      await processFile(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        await Promise.all(req.files.map(processFile));
      } else {
        // req.files berbentuk objek { fieldName: [file, ...] }
        for (const key of Object.keys(req.files)) {
          await Promise.all(req.files[key].map(processFile));
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

// ===== Ekspor kompatibel dengan kode lama =====
// upload.single("foto") → array [multer, processAndUpload]
// Express menerima array of middleware dengan baik.
export const upload = {
  single: (fieldName) => [multerUpload.single(fieldName), processAndUpload],
  array: (fieldName, maxCount) => [
    multerUpload.array(fieldName, maxCount),
    processAndUpload,
  ],
  fields: (fields) => [multerUpload.fields(fields), processAndUpload],
  none: () => multerUpload.none(),
  any: () => [multerUpload.any(), processAndUpload],
};

export { cloudinary };
