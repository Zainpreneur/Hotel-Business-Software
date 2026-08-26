import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Prisma unique constraint / known request errors
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") {
      return res.status(409).json({ error: "A record with these unique values already exists" });
    }
    if (code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
