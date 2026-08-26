import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { badRequest, notFound } from "../lib/errors";

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth);

invoicesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const invoices = await prisma.invoice.findMany({
      include: { reservation: { include: { guest: true, room: true } } },
      orderBy: { issuedAt: "desc" },
    });
    res.json(invoices);
  })
);

invoicesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { reservation: { include: { guest: true, room: { include: { roomType: true } }, payments: true } } },
    });
    res.json(invoice);
  })
);

const schema = z.object({
  reservationId: z.string(),
  taxRate: z.number().min(0).max(1).default(0),
  notes: z.string().optional(),
});

async function nextInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

// Generates an invoice from a reservation's total amount. One invoice per reservation.
invoicesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
      include: { invoice: true },
    });
    if (!reservation) throw notFound("Reservation");
    if (reservation.invoice) throw badRequest("An invoice already exists for this reservation");

    const subtotal = reservation.totalAmount;
    const taxAmount = subtotal * data.taxRate;
    const total = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        reservationId: data.reservationId,
        invoiceNumber: await nextInvoiceNumber(),
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        total,
        notes: data.notes,
      },
    });
    res.status(201).json(invoice);
  })
);
