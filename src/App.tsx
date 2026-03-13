import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth, isAdminRole, isSnookerStaffRole } from "./contexts/AuthContext";
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Invoices from "./pages/admin/Invoices";
import Products from "./pages/admin/Products";
import Customers from "./pages/admin/Customers";
import Vendors from "./pages/admin/Vendors";
import StaffManagement from "./pages/admin/StaffManagement";
import Coupons from "./pages/admin/Coupons";
import StaffProfile from "./pages/staff/Profile";
import AdminProfile from "./pages/admin/Profile";
import Reports from "./pages/admin/Reports";
import Inventory from "./pages/admin/Inventory";
import StockAudit from "./pages/admin/StockAudit";
import Assets from "./pages/admin/Assets";
import GamingSessions from "./pages/admin/GamingSessions";
import StaffLayout from "./pages/staff/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import POS from "./pages/staff/POS";
import SnookerLayout from "./pages/snooker/SnookerLayout";
import SnookerDashboard from "./pages/snooker/Dashboard";
import NewSession from "./pages/snooker/NewSession";
import ActiveSessions from "./pages/snooker/ActiveSessions";
import SnookerHistory from "./pages/snooker/History";
import SnookerProfile from "./pages/snooker/Profile";
import Tables from "./pages/staff/Tables";
import Kitchen from "./pages/staff/Kitchen";
import Orders from "./pages/staff/Orders";
import Shift from "./pages/staff/Shift";
import StaffAttendance from "./pages/staff/Attendance";
import StaffReports from "./pages/staff/Reports";
import StaffManualClosing from "./pages/staff/ManualClosing";
import StaffPurchaseEntry from "./pages/staff/PurchaseEntry";
import NotFound from "./pages/NotFound";
import { OfflineProvider } from "./contexts/OfflineContext";
import OfflineIndicator from "./components/OfflineIndicator";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: 'admin' | 'staff' | 'snooker' }) => {
  const { user } = useAuth();
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
  if (!user || !token) return <Navigate to="/" replace />;
  if (allowedRoles === 'admin' && !isAdminRole(user.role)) return <Navigate to={isSnookerStaffRole(user.role) ? "/snooker" : "/staff"} replace />;
  if (allowedRoles === 'staff' && (isAdminRole(user.role) || isSnookerStaffRole(user.role))) return <Navigate to={isAdminRole(user.role) ? "/admin" : "/snooker"} replace />;
  if (allowedRoles === 'snooker' && !isSnookerStaffRole(user.role)) return <Navigate to={isAdminRole(user.role) ? "/admin" : "/staff"} replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? (isAdminRole(user.role) ? <Navigate to="/admin" /> : isSnookerStaffRole(user.role) ? <Navigate to="/snooker" /> : <Navigate to="/staff" />) : <Login />} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="products" element={<Products />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="customers" element={<Customers />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="reports" element={<Reports />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="assets" element={<Assets />} />
        <Route path="stock-audit" element={<StockAudit />} />
        <Route path="gaming" element={<GamingSessions />} />
        <Route path="purchase-entry" element={<StaffPurchaseEntry />} />
        <Route path="payments" element={<Navigate to="/admin/vendors" replace />} />
        <Route path="settings" element={<Navigate to="/admin/vendors" replace />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="staff" element={<StaffManagement />} />
      </Route>

      <Route path="/staff" element={<ProtectedRoute allowedRoles="staff"><StaffLayout /></ProtectedRoute>}>
        <Route index element={<StaffDashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="tables" element={<Tables />} />
        <Route path="kitchen" element={<Kitchen />} />
        <Route path="orders" element={<Orders />} />
        <Route path="shift" element={<Shift />} />
        <Route path="profile" element={<StaffProfile />} />
        <Route path="reports" element={<StaffReports />} />
        <Route path="attendance" element={<StaffAttendance />} />
        <Route path="manual-closing" element={<StaffManualClosing />} />
      </Route>

      <Route path="/snooker" element={<ProtectedRoute allowedRoles="snooker"><SnookerLayout /></ProtectedRoute>}>
        <Route index element={<SnookerDashboard />} />
        <Route path="new-session" element={<NewSession />} />
        <Route path="active" element={<ActiveSessions />} />
        <Route path="history" element={<SnookerHistory />} />
        <Route path="profile" element={<SnookerProfile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const Router = typeof window !== "undefined" && window.location.protocol === "file:" ? HashRouter : BrowserRouter;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <AuthProvider>
            <OfflineProvider>
              <OfflineIndicator />
              <AppRoutes />
            </OfflineProvider>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
