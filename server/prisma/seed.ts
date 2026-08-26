import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hotel.test" },
    update: {},
    create: { name: "Alex Admin", email: "admin@hotel.test", passwordHash, role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "frontdesk@hotel.test" },
    update: {},
    create: { name: "Fiona Frontdesk", email: "frontdesk@hotel.test", passwordHash, role: "FRONT_DESK" },
  });

  await prisma.user.upsert({
    where: { email: "housekeeping@hotel.test" },
    update: {},
    create: { name: "Harry Housekeeping", email: "housekeeping@hotel.test", passwordHash, role: "HOUSEKEEPING" },
  });

  const roomTypeDefs = [
    { name: "Standard Single", basePrice: 79, capacity: 1, amenities: "Wi-Fi, TV, Air Conditioning" },
    { name: "Standard Double", basePrice: 99, capacity: 2, amenities: "Wi-Fi, TV, Air Conditioning" },
    { name: "Deluxe Suite", basePrice: 179, capacity: 3, amenities: "Wi-Fi, TV, Mini Bar, Balcony" },
    { name: "Executive Suite", basePrice: 259, capacity: 4, amenities: "Wi-Fi, TV, Mini Bar, Balcony, Lounge Access" },
  ];

  const roomTypes = [];
  for (const def of roomTypeDefs) {
    const existing = await prisma.roomType.findFirst({ where: { name: def.name } });
    roomTypes.push(existing ?? (await prisma.roomType.create({ data: def })));
  }

  const existingRoomCount = await prisma.room.count();
  if (existingRoomCount === 0) {
    let number = 101;
    for (let floor = 1; floor <= 3; floor++) {
      for (let i = 0; i < 6; i++) {
        const roomType = roomTypes[(floor + i) % roomTypes.length];
        await prisma.room.create({
          data: { number: String(number), floor, roomTypeId: roomType.id },
        });
        number++;
      }
      number = floor === 1 ? 201 : 301;
    }
  }

  const guestDefs = [
    { name: "Jordan Lee", email: "jordan.lee@example.com", phone: "555-0101" },
    { name: "Sam Rivera", email: "sam.rivera@example.com", phone: "555-0102" },
    { name: "Priya Nair", email: "priya.nair@example.com", phone: "555-0103" },
  ];
  const guests = [];
  for (const def of guestDefs) {
    const existing = await prisma.guest.findFirst({ where: { email: def.email } });
    guests.push(existing ?? (await prisma.guest.create({ data: def })));
  }

  const existingReservationCount = await prisma.reservation.count();
  if (existingReservationCount === 0) {
    const rooms = await prisma.room.findMany({ include: { roomType: true } });
    const today = new Date();
    const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 24 * 60 * 60 * 1000);

    // A currently checked-in guest.
    const room1 = rooms[0];
    const res1 = await prisma.reservation.create({
      data: {
        guestId: guests[0].id,
        roomId: room1.id,
        checkIn: addDays(today, -1),
        checkOut: addDays(today, 2),
        actualCheckIn: addDays(today, -1),
        status: "CHECKED_IN",
        ratePerNight: room1.roomType.basePrice,
        totalAmount: room1.roomType.basePrice * 3,
        createdById: admin.id,
      },
    });
    await prisma.room.update({ where: { id: room1.id }, data: { status: "OCCUPIED" } });
    await prisma.payment.create({
      data: { reservationId: res1.id, amount: res1.totalAmount, method: "CARD", status: "PAID" },
    });

    // An upcoming booking.
    const room2 = rooms[1];
    await prisma.reservation.create({
      data: {
        guestId: guests[1].id,
        roomId: room2.id,
        checkIn: addDays(today, 3),
        checkOut: addDays(today, 5),
        status: "BOOKED",
        ratePerNight: room2.roomType.basePrice,
        totalAmount: room2.roomType.basePrice * 2,
        createdById: admin.id,
      },
    });

    // A completed stay with an invoice.
    const room3 = rooms[2];
    const res3 = await prisma.reservation.create({
      data: {
        guestId: guests[2].id,
        roomId: room3.id,
        checkIn: addDays(today, -5),
        checkOut: addDays(today, -2),
        actualCheckIn: addDays(today, -5),
        actualCheckOut: addDays(today, -2),
        status: "CHECKED_OUT",
        ratePerNight: room3.roomType.basePrice,
        totalAmount: room3.roomType.basePrice * 3,
        createdById: admin.id,
      },
    });
    await prisma.payment.create({
      data: { reservationId: res3.id, amount: res3.totalAmount, method: "CASH", status: "PAID" },
    });
    await prisma.invoice.create({
      data: {
        reservationId: res3.id,
        invoiceNumber: "INV-2026-00001",
        subtotal: res3.totalAmount,
        taxRate: 0.1,
        taxAmount: res3.totalAmount * 0.1,
        total: res3.totalAmount * 1.1,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Login with: admin@hotel.test / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
