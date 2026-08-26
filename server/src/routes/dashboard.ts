import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRooms, occupiedRooms, availableRooms, cleaningRooms, maintenanceRooms] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: "OCCUPIED" } }),
      prisma.room.count({ where: { status: "AVAILABLE" } }),
      prisma.room.count({ where: { status: "CLEANING" } }),
      prisma.room.count({ where: { status: "MAINTENANCE" } }),
    ]);

    const [arrivalsToday, departuresToday, inHouseGuests] = await Promise.all([
      prisma.reservation.count({
        where: { status: "BOOKED", checkIn: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.reservation.count({
        where: { status: "CHECKED_IN", checkOut: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.reservation.count({ where: { status: "CHECKED_IN" } }),
    ]);

    const [monthlyPayments, pendingHousekeeping] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.housekeepingTask.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    ]);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    res.json({
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
        cleaning: cleaningRooms,
        maintenance: maintenanceRooms,
        occupancyRate,
      },
      today: {
        arrivals: arrivalsToday,
        departures: departuresToday,
        inHouseGuests,
      },
      revenue: {
        monthToDate: monthlyPayments._sum.amount ?? 0,
      },
      housekeeping: {
        pendingTasks: pendingHousekeeping,
      },
    });
  })
);

// Revenue for the last N days (default 14), grouped by calendar day, for a simple chart.
dashboardRouter.get(
  "/revenue-series",
  asyncHandler(async (req, res) => {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 14));
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.findMany({
      where: { status: "PAID", paidAt: { gte: since } },
      select: { amount: true, paidAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const p of payments) {
      const key = p.paidAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + p.amount);
    }

    res.json(Array.from(buckets.entries()).map(([date, total]) => ({ date, total })));
  })
);
