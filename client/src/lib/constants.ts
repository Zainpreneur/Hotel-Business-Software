// Mirrors server/src/lib/constants.ts — keep in sync.

export const ROLES = ["ADMIN", "MANAGER", "FRONT_DESK", "HOUSEKEEPING"] as const;
export const ROOM_STATUSES = ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE", "OUT_OF_SERVICE"] as const;
export const RESERVATION_STATUSES = ["BOOKED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"] as const;
export const PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "ONLINE"] as const;
export const PAYMENT_STATUSES = ["PENDING", "PAID", "REFUNDED", "FAILED"] as const;
export const HOUSEKEEPING_STATUSES = ["PENDING", "IN_PROGRESS", "DONE", "VERIFIED"] as const;

export type Role = (typeof ROLES)[number];
export type RoomStatus = (typeof ROOM_STATUSES)[number];
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type HousekeepingStatus = (typeof HOUSEKEEPING_STATUSES)[number];

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
  OUT_OF_SERVICE: "Out of service",
};

export const ROOM_STATUS_COLOR: Record<RoomStatus, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  OCCUPIED: "bg-blue-100 text-blue-800 border-blue-200",
  CLEANING: "bg-amber-100 text-amber-800 border-amber-200",
  MAINTENANCE: "bg-red-100 text-red-800 border-red-200",
  OUT_OF_SERVICE: "bg-slate-200 text-slate-700 border-slate-300",
};

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  BOOKED: "Booked",
  CHECKED_IN: "Checked in",
  CHECKED_OUT: "Checked out",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

export const RESERVATION_STATUS_COLOR: Record<ReservationStatus, string> = {
  BOOKED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  CHECKED_IN: "bg-blue-100 text-blue-800 border-blue-200",
  CHECKED_OUT: "bg-slate-200 text-slate-700 border-slate-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  NO_SHOW: "bg-orange-100 text-orange-800 border-orange-200",
};

export const HOUSEKEEPING_STATUS_LABEL: Record<HousekeepingStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  VERIFIED: "Verified",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  FRONT_DESK: "Front Desk",
  HOUSEKEEPING: "Housekeeping",
};
