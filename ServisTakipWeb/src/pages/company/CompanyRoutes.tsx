import { useEffect, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, Map as MapIcon } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/Loading";
import { Notice } from "@/components/Notice";
import { companyApi, routeApi, vehicleApi } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import type {
  Coordinate,
  DriverResponse,
  RouteCreatePayload,
  RouteResponse,
  RouteUpdatePayload,
  VehicleResponse,
} from "@/types";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) return String(err.message);
  return "Bir hata oluştu.";
};

function parseCoordinates(raw: string): Coordinate[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [lat, lng] = line.split(",").map((v) => Number(v.trim()));
      return { latitude: lat, longitude: lng };
    })
    .filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));
}

function coordinatesToText(coords: Coordinate[]): string {
  return coords.map((c) => `${c.latitude}, ${c.longitude}`).join("\n");
}

export function CompanyRoutes() {
  const { notify } = useToast();
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<RouteResponse | null>(null);
  const [deleting, setDeleting] = useState<RouteResponse | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, v, d] = await Promise.all([
        routeApi.list(),
        vehicleApi.list(),
        companyApi.listDrivers(),
      ]);
      setRoutes(r);
      setVehicles(v);
      setDrivers(d);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const vehiclePlate = (id: string) => vehicles.find((v) => v.id === id)?.plateNumber ?? "—";
  const driverName = (id: string) => {
    const d = drivers.find((x) => x.driverId === id);
    return d ? `${d.name} ${d.surname}` : "—";
  };

  const canCreate = vehicles.length > 0 && drivers.length > 0;

  return (
    <div>
      <PageHeader
        title="Rotalar"
        description="Araç ve şoför ataması yapılmış servis güzergahlarını tanımlayın."
        action={
          <button className="btn btn-accent" onClick={() => setShowCreate(true)} disabled={!canCreate}>
            <Plus size={15} />
            Rota oluştur
          </button>
        }
      />

      {!loading && !canCreate && (
        <Notice>
          Rota oluşturmadan önce en az bir araç ve bir şoför eklemeniz gerekir.
        </Notice>
      )}

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice kind="danger">{error}</Notice>
      ) : routes.length === 0 ? (
        <EmptyState
          icon={MapIcon}
          title="Henüz rota tanımlanmamış"
          description="Bir araç ve şoför seçerek ilk servis güzergahınızı oluşturun."
          action={
            canCreate ? (
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                <Plus size={13} /> Rota oluştur
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rota adı</th>
                  <th>Rota kodu</th>
                  <th>Araç</th>
                  <th>Şoför</th>
                  <th>Durak</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>
                      <span className="tag-pill">{r.routeCode}</span>
                    </td>
                    <td>{vehiclePlate(r.vehicleId)}</td>
                    <td>{driverName(r.driverId)}</td>
                    <td>{r.stops.length}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => setEditing(r)}>
                          <Pencil size={13} /> Düzenle
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(r)}>
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
        <RouteFormModal
          title="Yeni rota oluştur"
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setShowCreate(false)}
          onSubmit={async (payload) => {
            await routeApi.create(payload);
            setShowCreate(false);
            notify("Rota oluşturuldu.", "success");
            load();
          }}
        />
      )}

      {editing && (
        <RouteFormModal
          title={`${editing.name} — düzenle`}
          vehicles={vehicles}
          drivers={drivers}
          initial={{
            name: editing.name,
            vehicleId: editing.vehicleId,
            driverId: editing.driverId,
            pathCoordinates: editing.pathCoordinates,
          }}
          hideCoordinates
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            const updatePayload: RouteUpdatePayload = {
              name: payload.name,
              vehicleId: payload.vehicleId,
              driverId: payload.driverId,
            };
            await routeApi.update(editing.id, updatePayload);
            setEditing(null);
            notify("Rota güncellendi.", "success");
            load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Rotayı sil"
          description={`"${deleting.name}" rotasını silmek istediğinize emin misiniz?`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await routeApi.remove(deleting.id);
              notify("Rota silindi.", "success");
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

function RouteFormModal({
  title,
  vehicles,
  drivers,
  initial,
  hideCoordinates,
  onClose,
  onSubmit,
}: {
  title: string;
  vehicles: VehicleResponse[];
  drivers: DriverResponse[];
  initial?: RouteCreatePayload;
  hideCoordinates?: boolean;
  onClose: () => void;
  onSubmit: (payload: RouteCreatePayload) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? vehicles[0]?.id ?? "");
  const [driverId, setDriverId] = useState(initial?.driverId ?? drivers[0]?.driverId ?? "");
  const [coordsText, setCoordsText] = useState(coordinatesToText(initial?.pathCoordinates ?? []));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const pathCoordinates = parseCoordinates(coordsText);
    if (pathCoordinates.length === 1) {
      setError("Rota yolu çizilecekse en az iki koordinat girin (ya da alanı boş bırakın).");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name, vehicleId, driverId, pathCoordinates });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field field-full">
            <label>Rota adı</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Kadıköy Sabah Servisi" />
          </div>
          <div className="field">
            <label>Araç</label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} — {v.brandAndModel}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Şoför</label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              {drivers.map((d) => (
                <option key={d.driverId} value={d.driverId}>
                  {d.name} {d.surname}
                </option>
              ))}
            </select>
          </div>

          {!hideCoordinates && (
            <div className="field field-full">
              <label>Rota koordinatları (opsiyonel)</label>
              <textarea
                rows={5}
                value={coordsText}
                onChange={(e) => setCoordsText(e.target.value)}
                placeholder={"41.0082, 28.9784\n41.0125, 28.9612"}
              />
              <span className="field-hint">
                Her satıra bir nokta: enlem, boylam. Rota çizgisi çizilmeyecekse boş bırakabilirsiniz.
              </span>
            </div>
          )}
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
