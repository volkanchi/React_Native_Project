import { useEffect, useState } from "react";
import { Users, Car, Map, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { LoadingBlock } from "@/components/Loading";
import { Notice } from "@/components/Notice";
import { companyApi, extractErrorMessage, routeApi, vehicleApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export function CompanyOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ drivers: 0, vehicles: 0, routes: 0 });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [drivers, vehicles, routes] = await Promise.all([
          companyApi.listDrivers(),
          vehicleApi.list(),
          routeApi.list(),
        ]);
        if (!alive) return;
        setCounts({ drivers: drivers.length, vehicles: vehicles.length, routes: routes.length });
      } catch (err) {
        if (alive) setError(extractErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Genel bakış"
        description={`Hoş geldiniz${user?.email ? ", " + user.email : ""}. Firmanızın operasyonuna dair özet burada.`}
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice kind="danger">{error}</Notice>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Kayıtlı şoför" value={counts.drivers} icon={Users} tint="info" />
            <StatCard label="Kayıtlı araç" value={counts.vehicles} icon={Car} tint="accent" />
            <StatCard label="Aktif rota" value={counts.routes} icon={Map} tint="success" />
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Hızlı işlemler</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <QuickLink to="/company/soforler" label="Yeni şoför ekle" />
              <QuickLink to="/company/araclar" label="Araç kaydet ve şoför ata" />
              <QuickLink to="/company/rotalar" label="Yeni rota oluştur" />
              <QuickLink to="/company/profil" label="Firma bilgilerini güncelle" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        textDecoration: "none",
        color: "var(--text)",
        fontSize: 13.3,
        fontWeight: 500,
      }}
    >
      {label}
      <ArrowRight size={14} color="var(--text-muted)" />
    </Link>
  );
}
