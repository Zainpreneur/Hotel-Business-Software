import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const staffPassword = await bcrypt.hash("Staff@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hotel.com" },
    update: {},
    create: { name: "Alex Admin", email: "admin@hotel.com", password: adminPassword, role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "reception@hotel.com" },
    update: {},
    create: { name: "Riya Receptionist", email: "reception@hotel.com", password: staffPassword, role: "RECEPTIONIST" },
  });

  await prisma.user.upsert({
    where: { email: "housekeeping@hotel.com" },
    update: {},
    create: { name: "Sam Housekeeping", email: "housekeeping@hotel.com", password: staffPassword, role: "HOUSEKEEPING" },
  });

  const roomTypeDefs = [
    { name: "Standard Single", description: "Cozy single room with essential amenities", basePrice: 79, capacity: 1, amenities: "WiFi,TV,AC" },
    { name: "Standard Double", description: "Comfortable double room for two", basePrice: 99, capacity: 2, amenities: "WiFi,TV,AC,Mini-fridge" },
    { name: "Deluxe Suite", description: "Spacious suite with city view", basePrice: 179, capacity: 3, amenities: "WiFi,TV,AC,Mini-bar,Balcony" },
    { name: "Executive Suite", description: "Premium suite with lounge access", basePrice: 259, capacity: 4, amenities: "WiFi,TV,AC,Mini-bar,Balcony,Lounge Access" },
  ];

  const roomTypes = [];
  for (const rt of roomTypeDefs) {
    const created = await prisma.roomType.upsert({ where: { name: rt.name }, update: {}, create: rt });
    roomTypes.push(created);
  }

  const roomCount = await prisma.room.count();
  if (roomCount === 0) {
    let number = 101;
    for (let floor = 1; floor <= 3; floor++) {
      for (let i = 0; i < 6; i++) {
        const roomType = roomTypes[(floor + i) % roomTypes.length];
        await prisma.room.create({
          data: { number: String(floor * 100 + i + 1), floor, roomTypeId: roomType.id, status: "AVAILABLE" },
        });
        number++;
      }
    }
    console.log(`Created ${(number - 101)} rooms`);
  }

  const guestCount = await prisma.guest.count();
  if (guestCount === 0) {
    await prisma.guest.createMany({
      data: [
        { firstName: "John", lastName: "Doe", email: "john.doe@example.com", phone: "+1-555-0101" },
        { firstName: "Priya", lastName: "Sharma", email: "priya.sharma@example.com", phone: "+1-555-0102", vip: true },
        { firstName: "Carlos", lastName: "Mendez", email: "carlos.mendez@example.com", phone: "+1-555-0103" },
      ],
    });
    console.log("Created sample guests");
  }

  console.log("Seed complete.");
  console.log("Login with: admin@hotel.com / Admin@123 (ADMIN)");
  console.log("            reception@hotel.com / Staff@123 (RECEPTIONIST)");
  console.log("            housekeeping@hotel.com / Staff@123 (HOUSEKEEPING)");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
