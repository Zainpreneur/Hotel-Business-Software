import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma";
import { asyncHandler, ApiError } from "../utils/errors";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const selectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  active: true,
  createdAt: true,
};

// Any authenticated staff member can view the directory (used e.g. to
// assign housekeeping tasks); only ADMIN can edit or deactivate accounts.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ select: selectFields, orderBy: { createdAt: "desc" } });
    res.json(users);
  })
);

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MANAGER", "RECEPTIONIST", "HOUSEKEEPING", "ACCOUNTANT"]).optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

router.patch(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const update: any = { ...data };
    if (data.password) update.password = await bcrypt.hash(data.password, 10);
    const user = await prisma.user
      .update({ where: { id: req.params.id }, data: update, select: selectFields })
      .catch(() => null);
    if (!user) throw ApiError.notFound("User not found");
    res.json(user);
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.user.update({ where: { id: req.params.id }, data: { active: false } }).catch(() => {
      throw ApiError.notFound("User not found");
    });
    res.status(204).send();
  })
);

export default router;
