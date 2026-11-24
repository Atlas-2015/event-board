import argon2 from "argon2";
import pool from "../db.js";

import jwt from "jsonwebtoken";

export async function registerUser(req, res) {
  const { displayName, email, password, confirmPassword } = req.body ?? {};

  if (
    typeof displayName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return res.status(400).json({ error: "INVALID_INPUT" });
  }

  const name = displayName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!name || name.length > 60) {
    return res.status(400).json({ error: "INVALID_NAME" });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    normalizedEmail.length > 255 ||
    !emailPattern.test(normalizedEmail)
  ) {
    return res.status(400).json({ error: "INVALID_EMAIL" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "PASSWORD_MISMATCH" });
  }

  const validPassword =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password);

  if (!validPassword) {
    return res.status(400).json({ error: "INVALID_PASSWORD" });
  }

  try {
    // Passwörter vor der Speicherung mit Argon2id hashen.
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id
    });

    const result = await pool.query(
      `INSERT INTO "user"
        (display_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, display_name, email, role, created_at`,
      [name, normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      message: "REGISTRATION_SUCCESS",
      user: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
    }

    console.error("Registrierungsfehler:", error);

    return res.status(500).json({ error: "REGISTRATION_FAILED" });
  }
}

export async function loginUser(req, res) {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      error: "INVALID_INPUT"
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, display_name, email, password_hash, role
       FROM "user"
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email.trim()]
    );

    const user = result.rows[0];

    if (
      !user ||
      !(await argon2.verify(user.password_hash, password))
    ) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET fehlt");

      return res.status(500).json({
        error: "SERVER_CONFIGURATION_ERROR"
      });
    }

    // JWT mit begrenzter Gültigkeit für geschützte API-Routen erstellen.
    const token = jwt.sign(
      { role: user.role },
      process.env.JWT_SECRET,
      {
        subject: String(user.id),
        expiresIn: "2h",
        algorithm: "HS256",
        issuer: "event-board"
      }
    );

    return res.status(200).json({
      message: "LOGIN_SUCCESS",
      token,
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Anmeldefehler:", error);

    return res.status(500).json({
      error: "LOGIN_FAILED"
    });
  }
}
