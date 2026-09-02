import { useEffect, useState } from "react";
import { Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/Loading";
import { Notice } from "@/components/Notice";
import { adminApi} from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import { ROLE_LABELS, type AdminUserResponse, type NumericRole } from "@/types";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) return String(err.message);
  return "Bir hata oluştu.";
};

const roleBadgeClass: Record<NumericRole, string> = {
  1: "badge-yolcu",
  2: "badge-sofor",
  3: "badge-firma",
  4: "badge-admin",
};

export function AdminUsers() {
  const { notify } = useToast();
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<NumericRole | "all">("all");
  const [deleting, setDeleting] = useState<AdminUserResponse | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  return (
    <div>
      <PageHeader
        title="Kullanıcılar"
        description="Sistemdeki tüm yolcu, şoför, firma ve yönetici hesapları."
        action={
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value === "all" ? "all" : (Number(e.target.value) as NumericRole))
            }
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: 13,
            }}
          >
            <option value="all">Tüm roller</option>
            <option value={4}>Admin</option>
            <option value={3}>Firma</option>
            <option value={2}>Şoför</option>
            <option value={1}>Yolcu</option>
          </select>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice kind="danger">{error}</Notice>
      ) : visible.length === 0 ? (
        <EmptyState icon={Users} title="Kayıt bulunamadı" description="Seçilen filtreye uygun kullanıcı yok." />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>Kullanıcı adı</th>
                  <th>E-posta</th>
                  <th>Rol</th>
                  <th>Kayıt tarihi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id}>
                    <td>{[u.name, u.surname].filter(Boolean).join(" ") || "—"}</td>
                    <td>{u.username ?? "—"}</td>
                    <td>{u.email ?? "—"}</td>
                    <td>
                      <span className={`badge ${roleBadgeClass[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td>{u.createDate ? new Date(u.createDate).toLocaleDateString("tr-TR") : "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(u)}>
                          <Trash2 size={13} /> Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Kullanıcıyı sil"
          description={`"${deleting.name ?? deleting.username}" hesabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await adminApi.deleteUser(deleting.id);
              notify("Kullanıcı silindi.", "success");
              setDeleting(null);
              load();
            } catch (err) {
              notify(getErrorMessage(err), "error");
            }
          }}
        />
      )}
    </div>
  );
}
