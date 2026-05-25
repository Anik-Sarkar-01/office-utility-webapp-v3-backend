const multer = require("multer");

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
      return cb(new Error("Only JPG/PNG allowed"));
    }
    cb(null, true);
  },
});