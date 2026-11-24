import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export const uploadEventImage = multer({
  // Datei zur Typprüfung zunächst im Arbeitsspeicher halten.
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },

  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error("INVALID_IMAGE_TYPE"));
    }

    callback(null, true);
  }
}).single("image");
