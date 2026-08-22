import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { HOUSEKEEPING_STATUSES } from "../lib/constants";

export const housekeepingRouter = Router();
housekeepingRouter.use(requireAuth);

housekeepingRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status } = req.query as { status?: string };
    const tasks = await prisma.housekeepingTask.findMany({
      where: status ? { status } : undefined,
      include: { room: { include: { roomType: true } }, assignedTo: true },
      orderBy: { dueDate: "asc" },
    });
    res.json(tasks);
  })
);

const schema = z.object({
  roomId: z.string(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

housekeepingRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const task = await prisma.housekeepingTask.create({ data });
    res.status(201).json(task);
  })
);

const updateSchema = z.object({
  status: z.enum(HOUSEKEEPING_STATUSES).optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

housekeepingRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const completedAt = data.status === "DONE" || data.status === "VERIFIED" ? new Date() : undefined;

    const task = await prisma.housekeepingTask.update({
      where: { id: req.params.id },
      data: { ...data, ...(completedAt ? { completedAt } : {}) },
      include: { room: true },
    });

    // Once a room's cleaning task is marked done, make the room available again.
    if (data.status === "DONE") {
      await prisma.room.update({ where: { id: task.roomId }, data: { status: "AVAILABLE" } });
    }

    res.json(task);
  })
);
