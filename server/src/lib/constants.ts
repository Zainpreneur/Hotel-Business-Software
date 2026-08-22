// Central source of truth for status/role string values stored in SQLite
// (which has no native enum type). Keep in sync with prisma/schema.prisma
// comments and with client/src/lib/constants.ts.

export const ROLES = ["ADMIN", "MANAGER", "FRONT_DESK", "HOUSEKEEPING"] as const;
export const ROOM_STATUSES = ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE", "OUT_OF_SERVICE"] as const;
export const RESERVATION_STATUSES = ["BOOKED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"] as const;
export const PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "ONLINE"] as const;
export const PAYMENT_STATUSES = ["PENDING", "PAID", "REFUNDED", "FAILED"] as const;
export const HOUSEKEEPING_STATUSES = ["PENDING", "IN_PROGRESS", "DONE", "VERIFIED"] as const;
