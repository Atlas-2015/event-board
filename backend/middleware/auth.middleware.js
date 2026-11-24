import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;

  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      error: "AUTH_TOKEN_REQUIRED"
    });
  }

  const token = authorization.slice(7);

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET fehlt");

    return res.status(500).json({
      error: "SERVER_CONFIGURATION_ERROR"
    });
  }

  try {
    // JWT-Signatur und Ablaufzeit prüfen.
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "event-board"
    });

    req.user = {
      id: payload.sub,
      role: payload.role
    };

    next();

  } catch (error) {
    return res.status(401).json({
      error: "INVALID_AUTH_TOKEN"
    });
  }
}
