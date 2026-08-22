import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { badRequest, conflict, notFound } from "../lib/errors";
import { Prisma } from "@prisma/client";

export const reservationsRouter = Router();
reservationsRouter.use(requireAuth);

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// A room is unavailable for a new reservation if an existing, non-cancelled
// reservation on it overlaps the requested date range.
async function assertRoomAvailable(roomId: string, checkIn: Date, checkOut: Date, excludeId?: string) {
  const overlapping = await prisma.reservation.findFirst({
    where: {
      roomId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: ["BOOKED", "CHECKED_IN"] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
  if (overlapping) throw conflict("Room is already booked for the selected dates");
}

reservationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, from, to } = req.query as { status?: string; from?: string; to?: string };
    const reservations = await prisma.reservation.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(from ? { checkOut: { gte: new Date(from) } } : {}),
        ...(to ? { checkIn: { lte: new Date(to) } } : {}),
      },
      include: { guest: true, room: { include: { roomType: true } } },
      orderBy: { checkIn: "desc" },
    });
    res.json(reservations);
  })
);

// Check room availability across a date range, ignoring rooms with an overlapping active reservation.
// NOTE: this must be registered before the "/:id" route below, or "availability" would be parsed as an id.
reservationsRouter.get(
  "/availability/search",
  asyncHandler(async (req, res) => {
    const { checkIn, checkOut, roomTypeId } = req.query as {
      checkIn?: string;
      checkOut?: string;
      roomTypeId?: string;
    };
    if (!checkIn || !checkOut) throw badRequest("checkIn and checkOut are required");
    const from = new Date(checkIn);
    const to = new Date(checkOut);
    if (to <= from) throw badRequest("checkOut must be after checkIn");

    const rooms = await prisma.room.findMany({
      where: {
        roomTypeId: roomTypeId || undefined,
        status: { not: "OUT_OF_SERVICE" },
        reservations: {
          none: {
            status: { in: ["BOOKED", "CHECKED_IN"] },
            checkIn: { lt: to },
            checkOut: { gt: from },
          },
        },
      },
      include: { roomType: true },
      orderBy: { number: "asc" },
    });
    res.json(rooms);
  })
);

reservationsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        payments: true,
        invoice: true,
      },
    });
    res.json(reservation);
  })
);

const createSchema = z
  .object({
    guestId: z.string(),
    roomId: z.string(),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    adults: z.number().int().positive().default(1),
    children: z.number().int().min(0).default(0),
    source: z.string().optional(),
    ratePerNight: z.number().positive().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => d.checkOut > d.checkIn, { message: "checkOut must be after checkIn", path: ["checkOut"] });

reservationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const room = await prisma.room.findUnique({ where: { id: data.roomId }, include: { roomType: true } });
    if (!room) throw notFound("Room");

    await assertRoomAvailable(data.roomId, data.checkIn, data.checkOut);

    const rate = data.ratePerNight ?? room.roomType.basePrice;
    const totalAmount = rate * nightsBetween(data.checkIn, data.checkOut);

    const reservation = await prisma.reservation.create({
      data: {
        guestId: data.guestId,
        roomId: data.roomId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        adults: data.adults,
        children: data.children,
        source: data.source,
        ratePerNight: rate,
        totalAmount,
        notes: data.notes,
        createdById: req.user!.id,
      },
      include: { guest: true, room: { include: { roomType: true } } },
    });
    res.status(201).json(reservation);
  })
);

const updateSchema = z.object({
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  adults: z.number().int().positive().optional(),
  children: z.number().int().min(0).optional(),
  source: z.string().optional(),
  ratePerNight: z.number().positive().optional(),
  notes: z.string().optional(),
});

reservationsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Reservation");
    if (!["BOOKED"].includes(existing.status)) {
      throw badRequest("Only bookings that haven't checked in can be edited");
    }

    const checkIn = data.checkIn ?? existing.checkIn;
    const checkOut = data.checkOut ?? existing.checkOut;
    if (checkOut <= checkIn) throw badRequest("checkOut must be after checkIn");
    if (data.checkIn || data.checkOut) {
      await assertRoomAvailable(existing.roomId, checkIn, checkOut, existing.id);
    }

    const rate = data.ratePerNight ?? existing.ratePerNight;
    const totalAmount = rate * nightsBetween(checkIn, checkOut);

    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { ...data, checkIn, checkOut, ratePerNight: rate, totalAmount },
      include: { guest: true, room: { include: { roomType: true } } },
    });
    res.json(reservation);
  })
);

reservationsRouter.post(
  "/:id/check-in",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) throw notFound("Reservation");
    if (reservation.status !== "BOOKED") throw badRequest("Only booked reservations can be checked in");

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

reservationsRouter.post(
  "/:id/check-out",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) throw notFound("Reservation");
    if (reservation.status !== "CHECKED_IN") throw badRequest("Only checked-in reservations can be checked out");

    const [updated] = await prisma.$transaction([
      prisma.reservation.update({
        where: { id: req.params.id },
        data: { status: "CHECKED_OUT", actualCheckOut: new Date() },
        include: { guest: true, room: { include: { roomType: true } } },
      }),
      prisma.room.update({ where: { id: reservation.roomId }, data: { status: "CLEANING" } }),
      prisma.housekeepingTask.create({
        data: { roomId: reservation.roomId, notes: "Post-checkout cleaning" },
      }),
    ]);
    res.json(updated);
  })
);

reservationsRouter.post(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) throw notFound("Reservation");
    if (!["BOOKED", "CHECKED_IN"].includes(reservation.status)) {
      throw badRequest("Reservation cannot be cancelled in its current status");
    }

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.reservation.update({
        where: { id: req.params.id },
        data: { status: "CANCELLED" },
        include: { guest: true, room: { include: { roomType: true } } },
      }),
    ];
    if (reservation.status === "CHECKED_IN") {
      ops.push(prisma.room.update({ where: { id: reservation.roomId }, data: { status: "AVAILABLE" } }));
    }
    const [updated] = await prisma.$transaction(ops);
    res.json(updated);
  })
);
