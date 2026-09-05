// middleware/auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail at server startup, not on the first login attempt during the demo.
  // A crash here points straight at the .env file; a crash inside
  // jwt.sign() during a live login just looks like "the app is broken."
  throw new Error(
    "JWT_SECRET is not set. Check that .env exists and is loaded (see env.example) before starting the server."
  );
}

export function signToken(user) {
  // user: { id, role, email }
  return jwt.sign(user, JWT_SECRET, { expiresIn: "12h" });
}

export function errorBody(message, code) {
  return { error: true, message, code };
}

// Verifies Authorization: Bearer <token> and attaches req.user
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json(errorBody("Missing or malformed Authorization header", "UNAUTHORIZED"));
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json(errorBody("Invalid or expired token", "UNAUTHORIZED"));
  }
}

// Role-scoped guard, e.g. requireRole("asha_worker")
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json(errorBody("Not permitted for this role", "FORBIDDEN"));
    }
    next();
  };
}