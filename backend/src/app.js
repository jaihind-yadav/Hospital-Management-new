const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const routes = require("./routes");
const { pool } = require("./config/db");
const { errorHandler } = require("./middlewares/errorHandler");
const { responseDateFormatter } = require("./middlewares/responseDateFormatter");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseDateFormatter);

const uploadsDir = path.resolve(process.env.UPLOAD_DIR || "uploads");

app.get("/uploads/:filename", async (req, res, next) => {
  try {
    const safeFilename = path.basename(req.params.filename || "");
    const absoluteFilePath = path.resolve(uploadsDir, safeFilename);

    if (!absoluteFilePath.startsWith(uploadsDir)) {
      return res.status(400).json({ message: "Invalid file path" });
    }

    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    const [rows] = await pool.query(
      `SELECT file_type, file_name
       FROM reports
       WHERE file_path = ?
          OR file_path LIKE ?
          OR file_path LIKE ?
          OR file_path LIKE ?
       ORDER BY id DESC
       LIMIT 1`,
      [
        absoluteFilePath,
        `%${path.sep}${safeFilename}`,
        `%/${safeFilename}`,
        `%${safeFilename}`,
      ]
    );

    const report = rows[0] || null;
    const inferredExtension = String(report?.file_type || path.extname(report?.file_name || "").replace(".", "")).toLowerCase();
    const mimeTypeMap = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      bmp: "image/bmp",
      svg: "image/svg+xml",
    };

    const mimeType = mimeTypeMap[inferredExtension] || "application/octet-stream";

    res.removeHeader("X-Frame-Options");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' http://localhost:5173");
    res.type(mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${report?.file_name || safeFilename}"`);
    res.sendFile(absoluteFilePath);
  } catch (error) {
    next(error);
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "hospital-backend" });
});

app.use("/api", routes);
app.use(errorHandler);

module.exports = app;
