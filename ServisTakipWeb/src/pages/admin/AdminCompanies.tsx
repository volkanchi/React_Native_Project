import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2, Building2 } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/Loading";
import { Notice } from "@/components/Notice";
import { adminApi } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import type { CompanyCreatePayload, CompanyResponse } from "@/types";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) return String(err.message);
  return "Bir hata oluştu.";
};

const emptyForm: CompanyCreatePayload = {
  companyName: "",
  address: "",
  phoneNumber: "",
  email: "",
  username: "",
  password: "",
};

export function AdminCompanies() {
  const { notify } = useToast();
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<CompanyResponse | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listCompanies();
      setCompanies(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Firmalar"
        description="Sisteme kayıtlı tüm firmaları görüntüleyin, yeni firma oluşturun veya kaldırın."
        action={
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            Firma oluştur
          </button>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice kind="danger">{error}</Notice>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Henüz firma yok"
          description="Sisteme ilk firmayı oluşturarak başlayın."
          action={
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <Plus size={13} /> Firma oluştur
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Firma adı</th>
                  <th>Kullanıcı adı</th>
                  <th>E-posta</th>
                  <th>Telefon</th>
                  <th>Kayıt tarihi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td>{c.companyName}</td>
                    <td>{c.username}</td>
                    <td>{c.email}</td>
                    <td>{c.phoneNumber ?? "—"}</td>
                    <td>{new Date(c.createDate).toLocaleDateString("tr-TR")}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(c)}>
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

      {showCreate && (
        <CreateCompanyModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            notify("Firma oluşturuldu.", "success");
            load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Firmayı sil"
          description={`"${deleting.companyName}" firmasını silmek istediğinize emin misiniz? Bu işlem firmaya bağlı kullanıcıları etkileyebilir.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await adminApi.deleteCompany(deleting.id);
              notify("Firma silindi.", "success");
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

function CreateCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CompanyCreatePayload>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<CompanyCreatePayload>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.registerCompany(form);
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Yeni firma oluştur" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field field-full">
            <label>Firma adı</label>
            <input
              required
              minLength={2}
              value={form.companyName}
              onChange={(e) => update({ companyName: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Kullanıcı adı</label>
            <input required minLength={3} value={form.username} onChange={(e) => update({ username: e.target.value })} />
          </div>
          <div className="field">
            <label>E-posta</label>
            <input required type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} />
          </div>
          <div className="field">
            <label>Telefon</label>
            <input required value={form.phoneNumber} onChange={(e) => update({ phoneNumber: e.target.value })} />
          </div>
          <div className="field">
            <label>Şifre</label>
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => update({ password: e.target.value })}
            />
            <span className="field-hint">Büyük/küçük harf, rakam ve özel karakter içermeli.</span>
          </div>
          <div className="field field-full">
            <label>Adres</label>
            <textarea
              required
              minLength={5}
              rows={3}
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
            />
          </div>
        </div>

        {error && <p className="field-error" style={{ marginTop: 12 }}>{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting && <span className="spinner spinner-light" />}
            Firma oluştur
          </button>
        </div>
      </form>
    </Modal>
  );
}
