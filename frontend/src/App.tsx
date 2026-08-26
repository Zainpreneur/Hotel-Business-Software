import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Reservations from "./pages/Reservations";
import Guests from "./pages/Guests";
import GuestProfile from "./pages/GuestProfile";
import Billing from "./pages/Billing";
import InvoiceDetail from "./pages/InvoiceDetail";
import Housekeeping from "./pages/Housekeeping";
import Staff from "./pages/Staff";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/guests" element={<Guests />} />
        <Route path="/guests/:id" element={<GuestProfile />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing/:id" element={<InvoiceDetail />} />
        <Route path="/housekeeping" element={<Housekeeping />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
              <Staff />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}
