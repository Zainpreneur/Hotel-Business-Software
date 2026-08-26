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
    const { q } = req.query as { q?: string };
    const guests = await prisma.guest.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });
    res.json(guests);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const guest = await prisma.guest.findUnique({
      where: { id: req.params.id },
      include: {
        reservations: {
          orderBy: { checkIn: "desc" },
          include: { room: { include: { roomType: true } }, invoice: true },
        },
      },
    });
    if (!guest) throw ApiError.notFound("Guest not found");
    res.json(guest);
  })
);

const guestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  notes: z.string().optional(),
  vip: z.boolean().optional(),
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = guestSchema.parse(req.body);
    const guest = await prisma.guest.create({ data: { ...data, email: data.email || undefined } });
    res.status(201).json(guest);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = guestSchema.partial().parse(req.body);
    const guest = await prisma.guest
      .update({ where: { id: req.params.id }, data: { ...data, email: data.email || undefined } })
      .catch(() => null);
    if (!guest) throw ApiError.notFound("Guest not found");
    res.json(guest);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.guest.delete({ where: { id: req.params.id } }).catch(() => {
      throw ApiError.conflict("Cannot delete a guest with reservation history");
    });
    res.status(204).send();
  })
);

export default router;
