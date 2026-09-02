import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { ToastProvider } from "@/lib/ToastContext";
import { FullScreenLoading } from "@/components/Loading";
import { AppLayout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { CompanyOverview } from "@/pages/company/CompanyOverview";
import { CompanyProfile } from "@/pages/company/CompanyProfile";
import { CompanyDrivers } from "@/pages/company/CompanyDrivers";
import { CompanyVehicles } from "@/pages/company/CompanyVehicles";
import { CompanyRoutes } from "@/pages/company/CompanyRoutes";
import { AdminOverview } from "@/pages/admin/AdminOverview";
import { AdminCompanies } from "@/pages/admin/AdminCompanies";
import { AdminUsers } from "@/pages/admin/AdminUsers";

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoading />;
  if (!user) return <Navigate to="/giris" replace />;
  return <Navigate to={user.role === "Admin" ? "/admin" : "/company"} replace />;
}

function NotFoundPage() {
  return (
    <div className="center-screen" style={{ flexDirection: "column", gap: 6 }}>
      <strong style={{ color: "var(--ink)", fontSize: 18 }}>404</strong>
      Aradığınız sayfa bulunamadı.
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/giris" element={<LoginPage />} />

      <Route
        path="/company"
        element={
          <ProtectedRoute role="Firma">
            <AppLayout variant="company" />
          </ProtectedRoute>
        }
      >
        <Route index element={<CompanyOverview />} />
        <Route path="profil" element={<CompanyProfile />} />
        <Route path="soforler" element={<CompanyDrivers />} />
        <Route path="araclar" element={<CompanyVehicles />} />
        <Route path="rotalar" element={<CompanyRoutes />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="Admin">
            <AppLayout variant="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="firmalar" element={<AdminCompanies />} />
        <Route path="kullanicilar" element={<AdminUsers />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
