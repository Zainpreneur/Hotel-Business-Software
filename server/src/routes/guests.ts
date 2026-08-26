import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const guestsRouter = Router();
guestsRouter.use(requireAuth);

guestsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q } = req.query as { q?: string };
    const guests = await prisma.guest.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { reservations: true } } },
    });
    res.json(guests);
  })
);

guestsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const guest = await prisma.guest.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        reservations: {
          orderBy: { checkIn: "desc" },
          include: { room: { include: { roomType: true } }, payments: true, invoice: true },
        },
      },
    });
    res.json(guest);
  })
);

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  notes: z.string().optional(),
});

guestsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const guest = await prisma.guest.create({ data: { ...data, email: data.email || undefined } });
    res.status(201).json(guest);
  })
);

guestsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = schema.partial().parse(req.body);
    const guest = await prisma.guest.update({
      where: { id: req.params.id },
      data: { ...data, email: data.email || undefined },
    });
    res.json(guest);
  })
);

guestsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.guest.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
