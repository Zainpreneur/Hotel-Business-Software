import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { roomTypesRouter } from "./routes/roomTypes";
import { roomsRouter } from "./routes/rooms";
import { guestsRouter } from "./routes/guests";
import { reservationsRouter } from "./routes/reservations";
import { paymentsRouter } from "./routes/payments";
import { invoicesRouter } from "./routes/invoices";
import { housekeepingRouter } from "./routes/housekeeping";
import { dashboardRouter } from "./routes/dashboard";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") ?? "*",
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/room-types", roomTypesRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/guests", guestsRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/housekeeping", housekeepingRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Hotel API server listening on http://localhost:${PORT}`);
});
