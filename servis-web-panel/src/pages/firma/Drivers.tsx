import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import { Pencil, Plus, Trash2 } from 'lucide-react';

type Driver = {
  driverId: string;
  userId: string;
  name: string;
  surname: string;
  email: string;
  username: string;
  phoneNumber?: string;
};

type DriverForm = {
  name: string;
  surname: string;
  phoneNumber: string;
  email: string;
  username: string;
  password?: string;
};

const emptyDriver: DriverForm = {
  name: '',
  surname: '',
  phoneNumber: '',
  email: '',
  username: '',
  password: '',
};

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newDriver, setNewDriver] = useState<DriverForm>(emptyDriver);
  const [editingDriver, setEditingDriver] = useState<(DriverForm & { driverId: string }) | null>(null);

  const loadDrivers = async () => {
    try {
      const res = await api.get('/Company/drivers');
      const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setDrivers(items);
    } catch (error) {
      console.error('Şoförler yüklenemedi', error);
      setDrivers([]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchDrivers = async () => {
      try {
        const res = await api.get('/Company/drivers');
        if (isMounted) {
          const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
          setDrivers(items);
        }
      } catch (error) {
        console.error('Şoförler yüklenemedi', error);
        if (isMounted) setDrivers([]);
      }
    };
    fetchDrivers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/Company/add-driver', newDriver);
      setIsModalOpen(false);
      setNewDriver(emptyDriver);
      await loadDrivers();
    } catch (error) {
      console.error('Şoför eklenirken hata oluştu', error);
      alert('Şoför eklenirken hata oluştu. Lütfen bilgileri kontrol edin.');
    }
  };

  const handleDelete = async (driverId: string) => {
    try {
      if (!window.confirm('Bu şoförü silmek istediğinize emin misiniz?')) return;
      await api.delete(`/Company/delete-driver/${driverId}`);
      await loadDrivers();
    } catch (error) {
      console.error('Şoför silinirken hata oluştu', error);
      alert('Şoför silinirken hata oluştu');
    }
  };

  const handleEditClick = (driver: Driver) => {
    setEditingDriver({
      driverId: driver.driverId,
      name: driver.name,
      surname: driver.surname,
      phoneNumber: driver.phoneNumber ?? '',
      email: driver.email,
      username: driver.username,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    try {
      await api.put(`/Company/update-driver/${editingDriver.driverId}`, {
        name: editingDriver.name,
        surname: editingDriver.surname,
        phoneNumber: editingDriver.phoneNumber,
        email: editingDriver.email,
        username: editingDriver.username,
      });
      setIsEditModalOpen(false);
      setEditingDriver(null);
      await loadDrivers();
    } catch (error) {
      console.error('Şoför güncellenirken hata oluştu', error);
      alert('Şoför güncellenirken hata oluştu');
    }
  };

  return (
    <DashboardLayout role="Firma">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Şoför Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Filodaki şoförlerinizi buradan yönetin.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> Yeni Şoför Ekle
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Ad Soyad</th>
              <th className="p-4 font-semibold text-gray-600">Kullanıcı Adı</th>
              <th className="p-4 font-semibold text-gray-600">E-posta</th>
              <th className="p-4 font-semibold text-gray-600">Telefon</th>
              <th className="p-4 font-semibold text-gray-600 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Kayıtlı şoför bulunamadı.
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.driverId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{driver.name} {driver.surname}</td>
                  <td className="p-4 text-gray-600">{driver.username}</td>
                  <td className="p-4 text-gray-600">{driver.email}</td>
                  <td className="p-4 text-gray-600">{driver.phoneNumber ?? '-'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(driver)}
                        className="bg-orange-100 text-orange-600 hover:bg-orange-200 p-2 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(driver.driverId)}
                        className="bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded-lg transition-colors"
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

      {/* Yeni Şoför Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Yeni Şoför Ekle</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ad</label>
                  <input required type="text" value={newDriver.name} onChange={e => setNewDriver({ ...newDriver, name: e.target.value })} className="w-full border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Soyad</label>
                  <input required type="text" value={newDriver.surname} onChange={e => setNewDriver({ ...newDriver, surname: e.target.value })} className="w-full border p-2 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kullanıcı Adı</label>
                <input required type="text" value={newDriver.username} onChange={e => setNewDriver({ ...newDriver, username: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-posta</label>
                <input required type="email" value={newDriver.email} onChange={e => setNewDriver({ ...newDriver, email: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                <input required type="text" value={newDriver.phoneNumber} onChange={e => setNewDriver({ ...newDriver, phoneNumber: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Şifre</label>
                <input required type="password" value={newDriver.password} onChange={e => setNewDriver({ ...newDriver, password: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl">İptal</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 font-semibold rounded-xl hover:bg-blue-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Şoför Düzenleme Modalı */}
      {isEditModalOpen && editingDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Şoför Güncelle</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ad</label>
                  <input required type="text" value={editingDriver.name} onChange={e => setEditingDriver({ ...editingDriver, name: e.target.value })} className="w-full border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Soyad</label>
                  <input required type="text" value={editingDriver.surname} onChange={e => setEditingDriver({ ...editingDriver, surname: e.target.value })} className="w-full border p-2 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kullanıcı Adı</label>
                <input required type="text" value={editingDriver.username} onChange={e => setEditingDriver({ ...editingDriver, username: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-posta</label>
                <input required type="email" value={editingDriver.email} onChange={e => setEditingDriver({ ...editingDriver, email: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                <input required type="text" value={editingDriver.phoneNumber} onChange={e => setEditingDriver({ ...editingDriver, phoneNumber: e.target.value })} className="w-full border p-2 rounded-xl" />
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