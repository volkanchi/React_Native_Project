import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Car,
  Map,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const companyNav: NavItem[] = [
  { to: "/company", label: "Genel Bakış", icon: LayoutDashboard },
  { to: "/company/profil", label: "Firma Profili", icon: Building2 },
  { to: "/company/soforler", label: "Şoförler", icon: Users },
  { to: "/company/araclar", label: "Araçlar", icon: Car },
  { to: "/company/rotalar", label: "Rotalar", icon: Map },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Genel Bakış", icon: LayoutDashboard },
  { to: "/admin/firmalar", label: "Firmalar", icon: Building2 },
  { to: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
];

function initialsOf(email: string) {
  const name = email.split("@")[0] ?? "?";
  return name.slice(0, 2).toUpperCase();
}

export function AppLayout({ variant }: { variant: "company" | "admin" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = variant === "company" ? companyNav : adminNav;

  const handleLogout = () => {
    logout();
    navigate("/giris", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">ST</div>
          <div className="sidebar-brand-text">
            ServisTakip
            <span>{variant === "admin" ? "Yönetim Paneli" : "Firma Paneli"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/company" || item.to === "/admin"}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user ? initialsOf(user.email) : <ShieldCheck size={14} />}
            </div>
            <div className="sidebar-user-meta">
              <div className="sidebar-user-name">{user?.email}</div>
              <div className="sidebar-user-role">{variant === "admin" ? "Admin" : "Firma"}</div>
            </div>
          </div>
          <button className="signout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Oturumu kapat
          </button>
        </div>
      </aside>

      <div className="main-col">
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h2>{title}</h2>
        {description && <p className="page-head-desc">{description}</p>}
      </div>
      {action}
    </div>
  );
}
