import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/users.routes";
import roomTypeRoutes from "./routes/roomTypes.routes";
import roomRoutes from "./routes/rooms.routes";
import guestRoutes from "./routes/guests.routes";
import reservationRoutes from "./routes/reservations.routes";
import invoiceRoutes from "./routes/invoices.routes";
import housekeepingRoutes from "./routes/housekeeping.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/room-types", roomTypeRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/housekeeping", housekeepingRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
