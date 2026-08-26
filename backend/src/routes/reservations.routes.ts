import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { asyncHandler, ApiError } from "../utils/errors";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN"];

// Rooms with no overlapping active reservation in [checkIn, checkOut).
router.get(
  "/available-rooms",
  asyncHandler(async (req, res) => {
    const { checkIn, checkOut, roomTypeId } = req.query as {
      checkIn?: string;
      checkOut?: string;
      roomTypeId?: string;
    };
    if (!checkIn || !checkOut) throw ApiError.badRequest("checkIn and checkOut are required");
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      throw ApiError.badRequest("Invalid date range");
    }

    const rooms = await prisma.room.findMany({
      where: {
        status: { not: "OUT_OF_SERVICE" },
        ...(roomTypeId ? { roomTypeId } : {}),
        reservations: {
          none: {
            status: { in: ACTIVE_STATUSES as any },
            checkIn: { lt: end },
            checkOut: { gt: start },
          },
        },
      },
      include: { roomType: true },
      orderBy: { number: "asc" },
    });
    res.json(rooms);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, guestId, roomId, from, to } = req.query as Record<string, string | undefined>;
    const reservations = await prisma.reservation.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(guestId ? { guestId } : {}),
        ...(roomId ? { roomId } : {}),
        ...(from || to
          ? {
              checkIn: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) },
            }
          : {}),
      },
      include: { guest: true, room: { include: { roomType: true } }, invoice: true },
      orderBy: { checkIn: "desc" },
    });
    res.json(reservations);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { guest: true, room: { include: { roomType: true } }, invoice: { include: { items: true, payments: true } } },
    });
    if (!reservation) throw ApiError.notFound("Reservation not found");
    res.json(reservation);
  })
);

const reservationSchema = z.object({
  guestId: z.string().min(1),
  roomId: z.string().min(1),
  checkIn: z.string(),
  checkOut: z.string(),
  adults: z.number().int().positive().default(1),
  children: z.number().int().min(0).default(0),
  source: z.string().optional(),
  specialRequests: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"]).optional(),
});

async function assertRoomAvailable(roomId: string, checkIn: Date, checkOut: Date, excludeReservationId?: string) {
  const clash = await prisma.reservation.findFirst({
    where: {
      roomId,
      status: { in: ACTIVE_STATUSES as any },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
    },
  });
  if (clash) throw ApiError.conflict("Room is not available for the selected dates");
}

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = reservationSchema.parse(req.body);
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkIn >= checkOut) {
      throw ApiError.badRequest("Invalid date range");
    }
    await assertRoomAvailable(data.roomId, checkIn, checkOut);

    const room = await prisma.room.findUnique({ where: { id: data.roomId }, include: { roomType: true } });
    if (!room) throw ApiError.notFound("Room not found");

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * room.roomType.basePrice;

    const reservation = await prisma.reservation.create({
      data: {
        guestId: data.guestId,
        roomId: data.roomId,
        checkIn,
        checkOut,
        adults: data.adults,
        children: data.children,
        source: data.source,
        specialRequests: data.specialRequests,
        status: data.status ?? "CONFIRMED",
        totalAmount,
        createdById: req.user?.id,
      },
      include: { guest: true, room: { include: { roomType: true } } },
    });
    res.status(201).json(reservation);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = reservationSchema.partial().parse(req.body);
    const existing = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Reservation not found");

    const checkIn = data.checkIn ? new Date(data.checkIn) : existing.checkIn;
    const checkOut = data.checkOut ? new Date(data.checkOut) : existing.checkOut;
    const roomId = data.roomId ?? existing.roomId;
    if (data.checkIn || data.checkOut || data.roomId) {
      await assertRoomAvailable(roomId, checkIn, checkOut, existing.id);
    }

    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { ...data, checkIn, checkOut, roomId },
      include: { guest: true, room: { include: { roomType: true } } },
    });
    res.json(reservation);
  })
);

router.post(
  "/:id/check-in",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) throw ApiError.notFound("Reservation not found");
    if (!["PENDING", "CONFIRMED"].includes(reservation.status)) {
      throw ApiError.conflict(`Cannot check in a reservation with status ${reservation.status}`);
    }
    const [updated] = await prisma.$transaction([
      prisma.reservation.update({
        where: { id: req.params.id },
        data: { status: "CHECKED_IN", actualCheckIn: new Date() },
        include: { guest: true, room: { include: { roomType: true } } },
      }),
      prisma.room.update({ where: { id: reservation.roomId }, data: { status: "OCCUPIED" } }),
    ]);
    res.json(updated);
  })
);

router.post(
  "/:id/check-out",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) throw ApiError.notFound("Reservation not found");
    if (reservation.status !== "CHECKED_IN") {
      throw ApiError.conflict("Only a checked-in reservation can be checked out");
    }
    const [updated] = await prisma.$transaction([
      prisma.reservation.update({
        where: { id: req.params.id },
        data: { status: "CHECKED_OUT", actualCheckOut: new Date() },
        include: { guest: true, room: { include: { roomType: true } } },
      }),
      prisma.room.update({ where: { id: reservation.roomId }, data: { status: "CLEANING" } }),
      prisma.housekeepingTask.create({
        data: { roomId: reservation.roomId, type: "CLEANING", status: "PENDING", notes: "Post-checkout cleaning" },
      }),
    ]);
    res.json(updated);
  })
);

router.post(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) throw ApiError.notFound("Reservation not found");
    if (["CHECKED_OUT", "CANCELLED"].includes(reservation.status)) {
      throw ApiError.conflict(`Cannot cancel a reservation with status ${reservation.status}`);
    }
    const updated = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });
    res.json(updated);
  })
);

export default router;
