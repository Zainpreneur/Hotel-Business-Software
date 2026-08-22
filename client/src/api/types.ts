import type {
  HousekeepingStatus,
  PaymentMethod,
  PaymentStatus,
  ReservationStatus,
  Role,
  RoomStatus,
} from "../lib/constants";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
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
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  _count?: { reservations: number };
  reservations?: Reservation[];
}

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
  adults: number;
  children: number;
  status: ReservationStatus;
  source?: string | null;
  ratePerNight: number;
  totalAmount: number;
  notes?: string | null;
  payments?: Payment[];
  invoice?: Invoice | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  reference?: string | null;
  reservation?: Reservation;
}

export interface Invoice {
  id: string;
  reservationId: string;
  invoiceNumber: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  issuedAt: string;
  notes?: string | null;
  reservation?: Reservation;
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  room: Room;
  status: HousekeepingStatus;
  assignedToId?: string | null;
  assignedTo?: User | null;
  notes?: string | null;
  dueDate: string;
  completedAt?: string | null;
}

export interface DashboardSummary {
  rooms: {
    total: number;
    occupied: number;
    available: number;
    cleaning: number;
    maintenance: number;
    occupancyRate: number;
  };
  today: { arrivals: number; departures: number; inHouseGuests: number };
  revenue: { monthToDate: number };
  housekeeping: { pendingTasks: number };
}

export interface RevenuePoint {
  date: string;
  total: number;
}
