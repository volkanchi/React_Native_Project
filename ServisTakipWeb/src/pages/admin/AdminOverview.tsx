import { useEffect, useState } from "react";
import { Building2, Users, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { LoadingBlock } from "@/components/Loading";
import { Notice } from "@/components/Notice";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) return String(err.message);
  return "Bir hata oluştu.";
};

export function AdminOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ companies: 0, users: 0, admins: 0 });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [companies, users] = await Promise.all([
          adminApi.listCompanies(),
          adminApi.listUsers(),
        ]);
        if (!alive) return;
        setCounts({
          companies: companies.length,
          users: users.length,
          admins: users.filter((u) => u.role === 4).length,
        });
      } catch (err) {
        if (alive) setError(getErrorMessage(err));
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
        description={`Hoş geldiniz${user?.email ? ", " + user.email : ""}. Sistem genelindeki firma ve kullanıcı özetleri burada.`}
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice kind="danger">{error}</Notice>
      ) : (
        <div className="stat-grid">
          <StatCard label="Kayıtlı firma" value={counts.companies} icon={Building2} tint="info" />
          <StatCard label="Toplam kullanıcı" value={counts.users} icon={Users} tint="accent" />
          <StatCard label="Yönetici hesabı" value={counts.admins} icon={ShieldCheck} tint="success" />
        </div>
      )}

      <div className="card card-pad" style={{ marginTop: 4 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>Bu panel hakkında</h3>
        <p style={{ fontSize: 13.2, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Yeni bir firma hesabı yalnızca buradan, "Firmalar" sekmesinden oluşturulabilir —
          mobil uygulamada genel bir firma kayıt ekranı yoktur. Yolcu ve şoför hesapları
          firmalar tarafından kendi panellerinden veya mobil uygulama üzerinden yönetilir.
        </p>
      </div>
    </div>
  );
}
