import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2, Car, UserCog } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/Loading";
import { Notice } from "@/components/Notice";
import { companyApi, extractErrorMessage, vehicleApi } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import type { DriverResponse, VehicleCreatePayload, VehicleResponse } from "@/types";

const emptyForm: VehicleCreatePayload = { plateNumber: "", brandAndModel: "", seatingCapacity: 16 };

export function CompanyVehicles() {
  const { notify } = useToast();
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [assigning, setAssigning] = useState<VehicleResponse | null>(null);
  const [deleting, setDeleting] = useState<VehicleResponse | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [v, d] = await Promise.all([vehicleApi.list(), companyApi.listDrivers()]);
      setVehicles(v);
      setDrivers(d);
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
        title="Araçlar"
        description="Servis araçlarınızı kaydedin ve şoför atamalarını yönetin."
        action={
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            Araç ekle
          </button>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice kind="danger">{error}</Notice>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Henüz araç eklenmemiş"
          description="Filonuza ilk aracı ekleyerek rota tanımlamaya başlayabilirsiniz."
          action={
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <Plus size={13} /> Araç ekle
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plaka</th>
                  <th>Marka / Model</th>
                  <th>Kapasite</th>
                  <th>Kayıt tarihi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="tag-pill">{v.plateNumber}</span>
                    </td>
                    <td>{v.brandAndModel}</td>
                    <td>{v.capacity} kişi</td>
                    <td>{new Date(v.createDate).toLocaleDateString("tr-TR")}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => setAssigning(v)}>
                          <UserCog size={13} /> Şoför ata
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(v)}>
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
        <CreateVehicleModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            notify("Araç eklendi.", "success");
            load();
          }}
        />
      )}

      {assigning && (
        <AssignDriverModal
          vehicle={assigning}
          drivers={drivers}
          onClose={() => setAssigning(null)}
          onAssigned={() => {
            setAssigning(null);
            notify("Şoför araca atandı.", "success");
            load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Aracı sil"
          description={`${deleting.plateNumber} plakalı aracı silmek istediğinize emin misiniz?`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await vehicleApi.remove(deleting.id);
              notify("Araç silindi.", "success");
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

function CreateVehicleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<VehicleCreatePayload>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<VehicleCreatePayload>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await vehicleApi.create(form);
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Yeni araç ekle" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field field-full">
            <label>Plaka</label>
            <input
              required
              maxLength={20}
              value={form.plateNumber}
              onChange={(e) => update({ plateNumber: e.target.value.toUpperCase() })}
              placeholder="34 ABC 123"
            />
          </div>
          <div className="field field-full">
            <label>Marka / Model</label>
            <input
              required
              maxLength={100}
              value={form.brandAndModel}
              onChange={(e) => update({ brandAndModel: e.target.value })}
              placeholder="Mercedes Sprinter"
            />
          </div>
          <div className="field field-full">
            <label>Koltuk kapasitesi</label>
            <input
              required
              type="number"
              min={1}
              max={200}
              value={form.seatingCapacity}
              onChange={(e) => update({ seatingCapacity: Number(e.target.value) })}
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
            Araç ekle
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignDriverModal({
  vehicle,
  drivers,
  onClose,
  onAssigned,
}: {
  vehicle: VehicleResponse;
  drivers: DriverResponse[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [driverId, setDriverId] = useState(drivers[0]?.driverId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!driverId) {
      setError("Atanacak bir şoför seçin.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await vehicleApi.assignDriver({ driverId, vehicleId: vehicle.id });
      onAssigned();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`${vehicle.plateNumber} — şoför ata`} onClose={onClose}>
      {drivers.length === 0 ? (
        <Notice kind="danger">
          Atama yapabilmek için önce Şoförler sayfasından bir şoför eklemelisiniz.
        </Notice>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="field field-full">
            <label>Şoför</label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              {drivers.map((d) => (
                <option key={d.driverId} value={d.driverId}>
                  {d.name} {d.surname} ({d.username})
                </option>
              ))}
            </select>
          </div>

          {error && <p className="field-error" style={{ marginTop: 12 }}>{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Vazgeç
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting && <span className="spinner spinner-light" />}
              Ata
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
