import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/errors";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation error", details: err.flatten() });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  // Prisma unique constraint violation
  if (typeof err === "object" && err && (err as any).code === "P2002") {
    return res.status(409).json({ error: "A record with this value already exists" });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
