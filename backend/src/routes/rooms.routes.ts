import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { asyncHandler, ApiError } from "../utils/errors";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, roomTypeId } = req.query as { status?: string; roomTypeId?: string };
    const rooms = await prisma.room.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(roomTypeId ? { roomTypeId } : {}),
      },
      include: { roomType: true },
      orderBy: { number: "asc" },
    });
    res.json(rooms);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        roomType: true,
        reservations: { orderBy: { checkIn: "desc" }, take: 10, include: { guest: true } },
      },
    });
    if (!room) throw ApiError.notFound("Room not found");
    res.json(room);
  })
);

const roomSchema = z.object({
  number: z.string().min(1),
  floor: z.number().int().default(1),
  roomTypeId: z.string().min(1),
  status: z
    .enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE", "CLEANING", "OUT_OF_SERVICE"])
    .optional(),
  notes: z.string().optional(),
});

router.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const data = roomSchema.parse(req.body);
    const room = await prisma.room.create({ data, include: { roomType: true } });
    res.status(201).json(room);
  })
);

router.patch(
  "/:id",
  requireRole("ADMIN", "MANAGER", "RECEPTIONIST", "HOUSEKEEPING"),
  asyncHandler(async (req, res) => {
    const data = roomSchema.partial().parse(req.body);
    const room = await prisma.room
      .update({ where: { id: req.params.id }, data, include: { roomType: true } })
      .catch(() => null);
    if (!room) throw ApiError.notFound("Room not found");
    res.json(room);
  })
);

router.patch(
  "/:id/status",
  requireRole("ADMIN", "MANAGER", "RECEPTIONIST", "HOUSEKEEPING"),
  asyncHandler(async (req, res) => {
    const { status } = z
      .object({
        status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE", "CLEANING", "OUT_OF_SERVICE"]),
      })
      .parse(req.body);
    const room = await prisma.room.update({ where: { id: req.params.id }, data: { status } }).catch(() => null);
    if (!room) throw ApiError.notFound("Room not found");
    res.json(room);
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    await prisma.room.delete({ where: { id: req.params.id } }).catch(() => {
      throw ApiError.conflict("Cannot delete a room that has reservation history");
    });
    res.status(204).send();
  })
);

export default router;
