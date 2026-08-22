import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RoomsPage } from "./pages/RoomsPage";
import { RoomTypesPage } from "./pages/RoomTypesPage";
import { GuestsPage } from "./pages/GuestsPage";
import { GuestDetailPage } from "./pages/GuestDetailPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { ReservationDetailPage } from "./pages/ReservationDetailPage";
import { BillingPage } from "./pages/BillingPage";
import { HousekeepingPage } from "./pages/HousekeepingPage";
import { UsersPage } from "./pages/UsersPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/reservations/:id" element={<ReservationDetailPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route
              path="/room-types"
              element={
                <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                  <RoomTypesPage />
                </ProtectedRoute>
              }
            />
            <Route path="/guests" element={<GuestsPage />} />
            <Route path="/guests/:id" element={<GuestDetailPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/housekeeping" element={<HousekeepingPage />} />
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
