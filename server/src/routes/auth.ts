import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { badRequest, unauthorized } from "../lib/errors";
import { requireAuth, signToken } from "../middleware/auth";
import { ROLES } from "../lib/constants";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(ROLES).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// First user ever created is auto-promoted to ADMIN; afterwards only an ADMIN
// (via the /users endpoint) can create staff with elevated roles.
authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw badRequest("Email is already registered");

    const userCount = await prisma.user.count();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = userCount === 0 ? "ADMIN" : data.role ?? "FRONT_DESK";

    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.active) throw unauthorized("Invalid email or password");

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw unauthorized("Invalid email or password");

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw unauthorized();
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);
