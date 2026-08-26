import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma";
import { signToken } from "../utils/jwt";
import { asyncHandler, ApiError } from "../utils/errors";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) throw ApiError.unauthorized("Invalid email or password");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw ApiError.unauthorized("Invalid email or password");

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  })
);

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "MANAGER", "RECEPTIONIST", "HOUSEKEEPING", "ACCOUNTANT"]).default("RECEPTIONIST"),
  phone: z.string().optional(),
});

// Only an authenticated ADMIN can create new staff accounts.
router.post(
  "/register",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw ApiError.notFound("User not found");
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone });
  })
);

export default router;
