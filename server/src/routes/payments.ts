import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { notFound } from "../lib/errors";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "../lib/constants";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

const schema = z.object({
  reservationId: z.string(),
  amount: z.number().positive(),
  method: z.enum(PAYMENT_METHODS).default("CASH"),
  status: z.enum(PAYMENT_STATUSES).default("PAID"),
  reference: z.string().optional(),
});

paymentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { reservationId } = req.query as { reservationId?: string };
    const payments = await prisma.payment.findMany({
      where: reservationId ? { reservationId } : undefined,
      orderBy: { paidAt: "desc" },
      include: { reservation: { include: { guest: true } } },
    });
    res.json(payments);
  })
);

paymentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const reservation = await prisma.reservation.findUnique({ where: { id: data.reservationId } });
    if (!reservation) throw notFound("Reservation");
    const payment = await prisma.payment.create({ data });
    res.status(201).json(payment);
  })
);
