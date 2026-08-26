import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { asyncHandler, ApiError } from "../utils/errors";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const TAX_RATE = 0.1; // 10% flat tax, adjustable per business needs

function computeTotals(items: { quantity: number; unitPrice: number }[], discount: number) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const tax = Math.max(0, (subtotal - discount) * TAX_RATE);
  const total = Math.max(0, subtotal - discount + tax);
  return { subtotal, tax, total };
}

async function recalcInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true, payments: true } });
  if (!invoice) return null;
  const { subtotal, tax, total } = computeTotals(invoice.items, invoice.discount);
  const paid = invoice.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const status = paid <= 0 ? "UNPAID" : paid < total ? "PARTIALLY_PAID" : "PAID";
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, tax, total, status },
    include: { items: true, payments: true, reservation: { include: { guest: true, room: { include: { roomType: true } } } } },
  });
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status } = req.query as { status?: string };
    const invoices = await prisma.invoice.findMany({
      where: status ? { status: status as any } : undefined,
      include: { reservation: { include: { guest: true, room: true } }, payments: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        payments: true,
        reservation: { include: { guest: true, room: { include: { roomType: true } } } },
      },
    });
    if (!invoice) throw ApiError.notFound("Invoice not found");
    res.json(invoice);
  })
);

// Generate an invoice from a reservation, seeded with a room-charge line item.
router.post(
  "/generate/:reservationId",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.reservationId } });
    if (!reservation) throw ApiError.notFound("Reservation not found");

    const existing = await prisma.invoice.findUnique({ where: { reservationId: reservation.id } });
    if (existing) throw ApiError.conflict("An invoice already exists for this reservation");

    const nights = Math.ceil((reservation.checkOut.getTime() - reservation.checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(Date.now()).slice(-8)}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        reservationId: reservation.id,
        items: {
          create: [
            {
              description: `Room charge (${nights} night${nights === 1 ? "" : "s"})`,
              quantity: nights,
              unitPrice: reservation.totalAmount / Math.max(nights, 1),
              amount: reservation.totalAmount,
            },
          ],
        },
      },
      include: { items: true, payments: true },
    });

    const updated = await recalcInvoice(invoice.id);
    res.status(201).json(updated);
  })
);

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative(),
});

router.post(
  "/:id/items",
  asyncHandler(async (req, res) => {
    const data = itemSchema.parse(req.body);
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw ApiError.notFound("Invoice not found");
    await prisma.invoiceItem.create({
      data: { ...data, amount: data.quantity * data.unitPrice, invoiceId: invoice.id },
    });
    const updated = await recalcInvoice(invoice.id);
    res.status(201).json(updated);
  })
);

router.delete(
  "/:id/items/:itemId",
  asyncHandler(async (req, res) => {
    await prisma.invoiceItem.delete({ where: { id: req.params.itemId } }).catch(() => {
      throw ApiError.notFound("Invoice item not found");
    });
    const updated = await recalcInvoice(req.params.id);
    res.json(updated);
  })
);

const discountSchema = z.object({ discount: z.number().nonnegative() });

router.patch(
  "/:id/discount",
  asyncHandler(async (req, res) => {
    const { discount } = discountSchema.parse(req.body);
    const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: { discount } }).catch(() => null);
    if (!invoice) throw ApiError.notFound("Invoice not found");
    const updated = await recalcInvoice(invoice.id);
    res.json(updated);
  })
);

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["CASH", "CARD", "ONLINE", "BANK_TRANSFER"]).default("CASH"),
  transactionRef: z.string().optional(),
});

router.post(
  "/:id/payments",
  asyncHandler(async (req, res) => {
    const data = paymentSchema.parse(req.body);
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw ApiError.notFound("Invoice not found");
    if (invoice.status === "VOID") throw ApiError.conflict("Cannot add a payment to a void invoice");

    await prisma.payment.create({
      data: { ...data, status: "COMPLETED", invoiceId: invoice.id },
    });
    const updated = await recalcInvoice(invoice.id);
    res.status(201).json(updated);
  })
);

router.post(
  "/:id/void",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: { status: "VOID" } }).catch(() => null);
    if (!invoice) throw ApiError.notFound("Invoice not found");
    res.json(invoice);
  })
);

export default router;
