const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");
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

app.use(
  "/uploads",
  express.static(path.resolve(process.env.UPLOAD_DIR || "uploads"))
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "hospital-backend" });
});

app.use("/api", routes);
app.use(errorHandler);

module.exports = app;
