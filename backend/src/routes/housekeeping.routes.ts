import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { asyncHandler, ApiError } from "../utils/errors";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, roomId, assignedToId } = req.query as Record<string, string | undefined>;
    const tasks = await prisma.housekeepingTask.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(roomId ? { roomId } : {}),
        ...(assignedToId ? { assignedToId } : {}),
      },
      include: { room: { include: { roomType: true } }, assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  })
);

const taskSchema = z.object({
  roomId: z.string().min(1),
  assignedToId: z.string().optional(),
  type: z.enum(["CLEANING", "MAINTENANCE", "INSPECTION", "DEEP_CLEAN"]).default("CLEANING"),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = taskSchema.parse(req.body);
    const task = await prisma.housekeepingTask.create({
      data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
      include: { room: true, assignedTo: { select: { id: true, name: true } } },
    });
    res.status(201).json(task);
  })
);

const updateSchema = z.object({
  assignedToId: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "VERIFIED"]).optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.housekeepingTask.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Task not found");

    const task = await prisma.housekeepingTask.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedAt: data.status === "COMPLETED" ? new Date() : existing.completedAt,
      },
      include: { room: true, assignedTo: { select: { id: true, name: true } } },
    });

    // Completing a cleaning task frees the room back up for booking.
    if (data.status === "COMPLETED" && task.type === "CLEANING") {
      await prisma.room.update({ where: { id: task.roomId }, data: { status: "AVAILABLE" } });
    }
    res.json(task);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.housekeepingTask.delete({ where: { id: req.params.id } }).catch(() => {
      throw ApiError.notFound("Task not found");
    });
    res.status(204).send();
  })
);

export default router;
