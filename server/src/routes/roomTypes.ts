import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

export const roomTypesRouter = Router();
roomTypesRouter.use(requireAuth);

roomTypesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const types = await prisma.roomType.findMany({
      include: { _count: { select: { rooms: true } } },
      orderBy: { basePrice: "asc" },
    });
    res.json(types);
  })
);

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  capacity: z.number().int().positive().default(2),
  amenities: z.string().optional(),
});

roomTypesRouter.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const type = await prisma.roomType.create({ data });
    res.status(201).json(type);
  })
);

roomTypesRouter.patch(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const data = schema.partial().parse(req.body);
    const type = await prisma.roomType.update({ where: { id: req.params.id }, data });
    res.json(type);
  })
);

roomTypesRouter.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    await prisma.roomType.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
