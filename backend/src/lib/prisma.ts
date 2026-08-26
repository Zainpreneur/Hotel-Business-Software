import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance across the app.
const prisma = new PrismaClient();

export default prisma;
