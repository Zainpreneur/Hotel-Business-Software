import { api } from "./client";
import type {
  DashboardSummary,
  Guest,
  HousekeepingTask,
  Invoice,
  Payment,
  Reservation,
  RevenuePoint,
  Room,
  RoomType,
  User,
} from "./types";

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>("/auth/login", { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string) =>
    api.post<{ token: string; user: User }>("/auth/register", { name, email, password }).then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
};

// --- Users ---
export const usersApi = {
  list: () => api.get<User[]>("/users").then((r) => r.data),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<User>("/users", data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; role: string; active: boolean }>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),
};

// --- Room Types ---
export const roomTypesApi = {
  list: () => api.get<RoomType[]>("/room-types").then((r) => r.data),
  create: (data: Partial<RoomType>) => api.post<RoomType>("/room-types", data).then((r) => r.data),
  update: (id: string, data: Partial<RoomType>) => api.patch<RoomType>(`/room-types/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/room-types/${id}`),
};

// --- Rooms ---
export const roomsApi = {
  list: (params?: { status?: string; roomTypeId?: string }) =>
    api.get<Room[]>("/rooms", { params }).then((r) => r.data),
  get: (id: string) => api.get<Room & { reservations: Reservation[] }>(`/rooms/${id}`).then((r) => r.data),
  create: (data: { number: string; floor: number; roomTypeId: string; status?: string; notes?: string }) =>
    api.post<Room>("/rooms", data).then((r) => r.data),
  update: (id: string, data: Partial<{ number: string; floor: number; roomTypeId: string; status: string; notes: string }>) =>
    api.patch<Room>(`/rooms/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/rooms/${id}`),
};

// --- Guests ---
export const guestsApi = {
  list: (q?: string) => api.get<Guest[]>("/guests", { params: { q } }).then((r) => r.data),
  get: (id: string) => api.get<Guest>(`/guests/${id}`).then((r) => r.data),
  create: (data: Partial<Guest>) => api.post<Guest>("/guests", data).then((r) => r.data),
  update: (id: string, data: Partial<Guest>) => api.patch<Guest>(`/guests/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/guests/${id}`),
};

// --- Reservations ---
export const reservationsApi = {
  list: (params?: { status?: string; from?: string; to?: string }) =>
    api.get<Reservation[]>("/reservations", { params }).then((r) => r.data),
  get: (id: string) => api.get<Reservation>(`/reservations/${id}`).then((r) => r.data),
  availability: (checkIn: string, checkOut: string, roomTypeId?: string) =>
    api
      .get<Room[]>("/reservations/availability/search", { params: { checkIn, checkOut, roomTypeId } })
      .then((r) => r.data),
  create: (data: {
    guestId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    adults?: number;
    children?: number;
    source?: string;
    ratePerNight?: number;
    notes?: string;
  }) => api.post<Reservation>("/reservations", data).then((r) => r.data),
  update: (id: string, data: Partial<Reservation>) =>
    api.patch<Reservation>(`/reservations/${id}`, data).then((r) => r.data),
  checkIn: (id: string) => api.post<Reservation>(`/reservations/${id}/check-in`).then((r) => r.data),
  checkOut: (id: string) => api.post<Reservation>(`/reservations/${id}/check-out`).then((r) => r.data),
  cancel: (id: string) => api.post<Reservation>(`/reservations/${id}/cancel`).then((r) => r.data),
};

// --- Payments ---
export const paymentsApi = {
  list: (reservationId?: string) => api.get<Payment[]>("/payments", { params: { reservationId } }).then((r) => r.data),
  create: (data: { reservationId: string; amount: number; method: string; status?: string; reference?: string }) =>
    api.post<Payment>("/payments", data).then((r) => r.data),
};

// --- Invoices ---
export const invoicesApi = {
  list: () => api.get<Invoice[]>("/invoices").then((r) => r.data),
  get: (id: string) => api.get<Invoice>(`/invoices/${id}`).then((r) => r.data),
  create: (data: { reservationId: string; taxRate?: number; notes?: string }) =>
    api.post<Invoice>("/invoices", data).then((r) => r.data),
};

// --- Housekeeping ---
export const housekeepingApi = {
  list: (status?: string) => api.get<HousekeepingTask[]>("/housekeeping", { params: { status } }).then((r) => r.data),
  create: (data: { roomId: string; assignedToId?: string; notes?: string; dueDate?: string }) =>
    api.post<HousekeepingTask>("/housekeeping", data).then((r) => r.data),
  update: (id: string, data: Partial<{ status: string; assignedToId: string; notes: string }>) =>
    api.patch<HousekeepingTask>(`/housekeeping/${id}`, data).then((r) => r.data),
};

// --- Dashboard ---
export const dashboardApi = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
  revenueSeries: (days = 14) =>
    api.get<RevenuePoint[]>("/dashboard/revenue-series", { params: { days } }).then((r) => r.data),
};
