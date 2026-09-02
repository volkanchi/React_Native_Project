import { useEffect, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/Loading";
import { Notice } from "@/components/Notice";
import { companyApi, extractErrorMessage } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import type { DriverCreatePayload, DriverResponse, DriverUpdatePayload } from "@/types";

const emptyCreate: DriverCreatePayload = {
  name: "",
  surname: "",
  email: "",
  phoneNumber: "",
  username: "",
  password: "",
};

export function CompanyDrivers() {
  const { notify } = useToast();
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<DriverResponse | null>(null);
  const [deleting, setDeleting] = useState<DriverResponse | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyApi.listDrivers();
      setDrivers(data);
    } catch (err) {
      setError(extractErrorMessage(err));
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
        title="Şoförler"
        description="Firmanıza bağlı şoför hesaplarını ekleyin, güncelleyin veya kaldırın."
        action={
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            Şoför ekle
          </button>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice kind="danger">{error}</Notice>
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Henüz şoför eklenmemiş"
          description="Sisteme ilk şoförünüzü ekleyerek rota atamalarına başlayabilirsiniz."
          action={
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <Plus size={13} /> Şoför ekle
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>Kullanıcı adı</th>
                  <th>E-posta</th>
                  <th>Telefon</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.driverId}>
                    <td>{d.name} {d.surname}</td>
                    <td>{d.username}</td>
                    <td>{d.email}</td>
                    <td>{d.phoneNumber}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => setEditing(d)}>
                          <Pencil size={13} /> Düzenle
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(d)}>
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
        <CreateDriverModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            notify("Şoför eklendi.", "success");
            load();
          }}
        />
      )}

      {editing && (
        <EditDriverModal
          driver={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            notify("Şoför bilgileri güncellendi.", "success");
            load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Şoförü sil"
          description={`${deleting.name} ${deleting.surname} adlı şoförü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await companyApi.deleteDriver(deleting.driverId);
              notify("Şoför silindi.", "success");
              setDeleting(null);
              load();
            } catch (err) {
              notify(extractErrorMessage(err), "error");
            }
          }}
        />
      )}
    </div>
  );
}

function CreateDriverModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<DriverCreatePayload>(emptyCreate);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<DriverCreatePayload>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await companyApi.addDriver(form);
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Yeni şoför ekle" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Ad</label>
            <input required minLength={2} value={form.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="field">
            <label>Soyad</label>
            <input required minLength={2} value={form.surname} onChange={(e) => update({ surname: e.target.value })} />
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
            <label>Kullanıcı adı</label>
            <input required minLength={3} value={form.username} onChange={(e) => update({ username: e.target.value })} />
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
        </div>

        {error && <p className="field-error" style={{ marginTop: 12 }}>{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting && <span className="spinner spinner-light" />}
            Şoför ekle
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditDriverModal({
  driver,
  onClose,
  onSaved,
}: {
  driver: DriverResponse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<DriverUpdatePayload>({
    name: driver.name ?? "",
    surname: driver.surname ?? "",
    phoneNumber: driver.phoneNumber ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<DriverUpdatePayload>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await companyApi.updateDriver(driver.driverId, form);
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`${driver.name} ${driver.surname} — düzenle`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Ad</label>
            <input required minLength={2} value={form.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="field">
            <label>Soyad</label>
            <input required minLength={2} value={form.surname} onChange={(e) => update({ surname: e.target.value })} />
          </div>
          <div className="field field-full">
            <label>Telefon</label>
            <input required value={form.phoneNumber} onChange={(e) => update({ phoneNumber: e.target.value })} />
          </div>
        </div>

        {error && <p className="field-error" style={{ marginTop: 12 }}>{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting && <span className="spinner spinner-light" />}
            Kaydet
          </button>
        </div>
      </form>
    </Modal>
  );
}
