import { Router } from "express";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/errors";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const [totalRooms, roomStatusCounts, arrivalsToday, departuresToday, inHouse, revenueAgg, upcoming] =
      await Promise.all([
        prisma.room.count(),
        prisma.room.groupBy({ by: ["status"], _count: { status: true } }),
        prisma.reservation.count({
          where: { checkIn: { gte: todayStart, lte: todayEnd }, status: { in: ["PENDING", "CONFIRMED"] } },
        }),
        prisma.reservation.count({
          where: { checkOut: { gte: todayStart, lte: todayEnd }, status: "CHECKED_IN" },
        }),
        prisma.reservation.count({ where: { status: "CHECKED_IN" } }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "COMPLETED", createdAt: { gte: todayStart, lte: todayEnd } },
        }),
        prisma.reservation.findMany({
          where: { checkIn: { gte: todayStart }, status: { in: ["PENDING", "CONFIRMED"] } },
          orderBy: { checkIn: "asc" },
          take: 5,
          include: { guest: true, room: true },
        }),
      ]);

    const occupied = roomStatusCounts.find((r) => r.status === "OCCUPIED")?._count.status ?? 0;
    const statusMap: Record<string, number> = {};
    roomStatusCounts.forEach((r) => (statusMap[r.status] = r._count.status));

    res.json({
      totalRooms,
      occupiedRooms: occupied,
      occupancyRate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
      roomStatusCounts: statusMap,
      arrivalsToday,
      departuresToday,
      guestsInHouse: inHouse,
      revenueToday: revenueAgg._sum.amount ?? 0,
      upcomingArrivals: upcoming,
    });
  })
);

export default router;
