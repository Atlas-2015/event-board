import express from "express";
import pool from "./db.js";
import authRouter from "./routes/auth.routes.js";

import eventRouter from "./routes/event.routes.js";

import { fileURLToPath } from "node:url";

const app = express();

const PORT = process.env.PORT || 3001;

app.use(express.json());

const uploadsDirectory = fileURLToPath(
  new URL("./uploads/", import.meta.url)
);

app.use("/uploads", express.static(uploadsDirectory));

app.use("/api/auth", authRouter);

app.use("/api/events", eventRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Event-Board Backend läuft!"
  });
});

app.get("/api/db-health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Datenbankfehler:", error.message);

    res.status(503).json({
      status: "error",
      database: "unavailable"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Event-Board Backend ist bereit! Port: ${PORT}`);
});
