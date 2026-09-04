import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { signToken, errorBody } from "../middleware/auth.js";

export const authRouter = Router();

// POST /api/auth/login  { email, password, role } -> { token, user }
// Matches CONTRACTS.md ยง4 and what Person 6's dashboard client.js already calls.
authRouter.post("/login", (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || !role) {
    return res.status(400).json(errorBody("email, password, and role are required", "VALIDATION_ERROR"));
  }

  const caregiver = db
    .prepare("SELECT * FROM caregivers WHERE email = ? AND role = ?")
    .get(email, role);

  if (!caregiver || !bcrypt.compareSync(password, caregiver.password_hash)) {
    return res.status(401).json(errorBody("Invalid email, password, or role", "UNAUTHORIZED"));
  }

  const user = { id: caregiver.id, role: caregiver.role, email: caregiver.email, name: caregiver.name };
  const token = signToken(user);
  res.json({ token, user });
});
