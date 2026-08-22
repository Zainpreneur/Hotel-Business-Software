import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { ROOM_STATUSES } from "../lib/constants";

export const roomsRouter = Router();
roomsRouter.use(requireAuth);

roomsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, roomTypeId } = req.query as { status?: string; roomTypeId?: string };
    const rooms = await prisma.room.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(roomTypeId ? { roomTypeId } : {}),
      },
      include: { roomType: true },
      orderBy: { number: "asc" },
    });
    res.json(rooms);
  })
);

roomsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const room = await prisma.room.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        roomType: true,
        reservations: { orderBy: { checkIn: "desc" }, take: 10, include: { guest: true } },
      },
    });
    res.json(room);
  })
);

const schema = z.object({
  number: z.string().min(1),
  floor: z.number().int().default(1),
  roomTypeId: z.string(),
  status: z.enum(ROOM_STATUSES).optional(),
  notes: z.string().optional(),
});

roomsRouter.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const room = await prisma.room.create({ data });
    res.status(201).json(room);
  })
);

roomsRouter.patch(
  "/:id",
  requireRole("ADMIN", "MANAGER", "FRONT_DESK", "HOUSEKEEPING"),
  asyncHandler(async (req, res) => {
    const data = schema.partial().parse(req.body);
    const room = await prisma.room.update({ where: { id: req.params.id }, data });
    res.json(room);
  })
);

roomsRouter.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    await prisma.room.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
