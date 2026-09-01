import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import { Pencil, Plus, Trash2 } from 'lucide-react';

type RouteItem = {
  id: string;
  routeCode?: string;
  name?: string;
  vehicleId?: string;
  driverId?: string;
  pathCoordinates?: Array<{ latitude: number; longitude: number }>;
};

type RouteForm = {
  name: string;
  vehicleId: string;
  driverId: string;
  pathCoordinates: Array<{ latitude: number; longitude: number }>;
};

const emptyRoute: RouteForm = {
  name: '',
  vehicleId: '',
  driverId: '',
  pathCoordinates: [],
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newRoute, setNewRoute] = useState<RouteForm>(emptyRoute);
  const [editingRoute, setEditingRoute] = useState<(RouteForm & { id: string }) | null>(null);

  const loadRoutes = async () => {
    try {
      const res = await api.get('/Route');
      const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setRoutes(items);
    } catch (error) {
      console.error('Rotalar yüklenemedi', error);
      setRoutes([]);
    }
  };

  useEffect(() => {
      let isMounted = true;
  
      const fetchVehicles = async () => {
        try {
          const res = await api.get('/Vehicles');
          if (isMounted && res.data.success) {
            setRoutes(res.data.data);
          }
        } catch (error) {
          console.error('Araçlar yüklenemedi', error);
        }
      };
  
      fetchVehicles();
  
      return () => {
        isMounted = false;
      };
    }, []);


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post('/Route/create', {
        name: newRoute.name,
        vehicleId: newRoute.vehicleId,
        driverId: newRoute.driverId,
        pathCoordinates: newRoute.pathCoordinates,
      });
      setIsModalOpen(false);
      setNewRoute(emptyRoute);
      await loadRoutes();
    } catch (error) {
      console.error('Rota eklenirken hata oluştu', error);
      alert('Rota eklenirken hata oluştu');
    }
  };

  const handleDelete = async (routeId: string) => {
    try {
      if (!window.confirm('Bu rotayı silmek istediğinize emin misiniz?')) return;
      await api.delete(`/Route/${routeId}`);
      await loadRoutes();
    } catch (error) {
      console.error('Rota silinirken hata oluştu', error);
      alert('Rota silinirken hata oluştu');
    }
  };

  const handleEditClick = (route: RouteItem) => {
    setEditingRoute({
      id: route.id,
      name: route.name ?? '',
      vehicleId: route.vehicleId ?? '',
      driverId: route.driverId ?? '',
      pathCoordinates: route.pathCoordinates ?? [],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRoute) return;

    try {
      await api.put(`/Route/${editingRoute.id}`, {
        name: editingRoute.name,
        vehicleId: editingRoute.vehicleId,
        driverId: editingRoute.driverId,
      });

      setIsEditModalOpen(false);
      setEditingRoute(null);
      await loadRoutes();
    } catch (error) {
      console.error('Rota güncellenirken hata oluştu', error);
      alert('Rota güncellenirken hata oluştu');
    }
  };

  return (
    <DashboardLayout role="Firma">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rota Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Filo rota planlamasını ve güncellemelerini yönetin.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> Yeni Rota Ekle
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Rota Kodu</th>
              <th className="p-4 font-semibold text-gray-600">Rota Adı</th>
              <th className="p-4 font-semibold text-gray-600">Araç</th>
              <th className="p-4 font-semibold text-gray-600">Şoför</th>
              <th className="p-4 font-semibold text-gray-600 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Kayıtlı rota bulunamadı.
                </td>
              </tr>
            ) : (
              routes.map((route) => (
                <tr key={route.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{route.routeCode ?? '—'}</td>
                  <td className="p-4 text-gray-600">{route.name ?? '—'}</td>
                  <td className="p-4 text-gray-600">{route.vehicleId ?? '—'}</td>
                  <td className="p-4 text-gray-600">{route.driverId ?? '—'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(route)}
                        className="bg-orange-100 text-orange-600 hover:bg-orange-200 p-2 rounded-lg transition-colors"
                        aria-label="Rotayı güncelle"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(route.id)}
                        className="bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded-lg transition-colors"
                        aria-label="Rotayı sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Yeni Rota Ekle</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rota Adı</label>
                <input required type="text" value={newRoute.name} onChange={e => setNewRoute({ ...newRoute, name: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Araç ID</label>
                <input required type="text" value={newRoute.vehicleId} onChange={e => setNewRoute({ ...newRoute, vehicleId: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Şoför ID</label>
                <input required type="text" value={newRoute.driverId} onChange={e => setNewRoute({ ...newRoute, driverId: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl">İptal</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 font-semibold rounded-xl hover:bg-blue-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Rota Güncelle</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rota Adı</label>
                <input required type="text" value={editingRoute.name} onChange={e => setEditingRoute({ ...editingRoute, name: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Araç ID</label>
                <input required type="text" value={editingRoute.vehicleId} onChange={e => setEditingRoute({ ...editingRoute, vehicleId: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Şoför ID</label>
                <input required type="text" value={editingRoute.driverId} onChange={e => setEditingRoute({ ...editingRoute, driverId: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl">İptal</button>
                <button type="submit" className="bg-orange-500 text-white px-4 py-2 font-semibold rounded-xl hover:bg-orange-600">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
