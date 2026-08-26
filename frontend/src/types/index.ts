export type Role = "ADMIN" | "MANAGER" | "RECEPTIONIST" | "HOUSEKEEPING" | "ACCOUNTANT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  active?: boolean;
  createdAt?: string;
}

export interface RoomType {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  capacity: number;
  amenities?: string | null;
  _count?: { rooms: number };
}

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "CLEANING" | "OUT_OF_SERVICE";

export interface Room {
  id: string;
  number: string;
  floor: number;
  status: RoomStatus;
  notes?: string | null;
  roomTypeId: string;
  roomType: RoomType;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  notes?: string | null;
  vip: boolean;
  createdAt?: string;
  reservations?: Reservation[];
}

export type ReservationStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";

export interface Reservation {
  id: string;
  guestId: string;
  guest: Guest;
  roomId: string;
  room: Room;
  checkIn: string;
  checkOut: string;
  actualCheckIn?: string | null;
  actualCheckOut?: string | null;
  status: ReservationStatus;
  adults: number;
  children: number;
  source?: string | null;
  specialRequests?: string | null;
  totalAmount: number;
  invoice?: Invoice | null;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: "CASH" | "CARD" | "ONLINE" | "BANK_TRANSFER";
  status: string;
  transactionRef?: string | null;
  createdAt: string;
}

export type InvoiceStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  reservationId: string;
  reservation?: Reservation;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
}

export type HousekeepingStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "VERIFIED";
export type HousekeepingType = "CLEANING" | "MAINTENANCE" | "INSPECTION" | "DEEP_CLEAN";

export interface HousekeepingTask {
  id: string;
  roomId: string;
  room: Room;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  type: HousekeepingType;
  status: HousekeepingStatus;
  notes?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  roomStatusCounts: Record<string, number>;
  arrivalsToday: number;
  departuresToday: number;
  guestsInHouse: number;
  revenueToday: number;
  upcomingArrivals: Reservation[];
}
