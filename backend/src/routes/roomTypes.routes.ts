import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { asyncHandler, ApiError } from "../utils/errors";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const roomTypes = await prisma.roomType.findMany({
      include: { _count: { select: { rooms: true } } },
      orderBy: { basePrice: "asc" },
    });
    res.json(roomTypes);
  })
);

const roomTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  capacity: z.number().int().positive().default(2),
  amenities: z.string().optional(),
});

router.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const data = roomTypeSchema.parse(req.body);
    const roomType = await prisma.roomType.create({ data });
    res.status(201).json(roomType);
  })
);

router.patch(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const data = roomTypeSchema.partial().parse(req.body);
    const roomType = await prisma.roomType.update({ where: { id: req.params.id }, data }).catch(() => null);
    if (!roomType) throw ApiError.notFound("Room type not found");
    res.json(roomType);
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    await prisma.roomType.delete({ where: { id: req.params.id } }).catch(() => {
      throw ApiError.conflict("Cannot delete a room type that still has rooms assigned");
    });
    res.status(204).send();
  })
);

export default router;
