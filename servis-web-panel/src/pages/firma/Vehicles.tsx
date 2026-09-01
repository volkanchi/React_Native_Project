import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import { Plus, Trash2 } from 'lucide-react';

type Vehicle = {
  id: string;
  plateNumber: string;
  brandAndModel: string;
  capacity: number;
  createDate: string;
};

const emptyVehicle = {
  plateNumber: '',
  brandAndModel: '',
  seatingCapacity: 0,
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState(emptyVehicle);

  const loadVehicles = async () => {
    try {
      const res = await api.get('/Vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (error) {
      console.error('Araçlar yüklenemedi', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      try {
        const res = await api.get('/Vehicles');
        if (isMounted && res.data.success) {
          setVehicles(res.data.data);
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
      await api.post('/Vehicles/add-vehicle', newVehicle);
      setIsModalOpen(false);
      setNewVehicle(emptyVehicle);
      await loadVehicles();
    } catch (error) {
      console.error('Araç eklenirken hata oluştu', error);
      alert('Araç eklenirken hata oluştu');
    }
  };

  return (
    <DashboardLayout role="Firma">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Araç Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Filodaki araçlarınızı buradan yönetin.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> Yeni Araç Ekle
        </button>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Plaka</th>
              <th className="p-4 font-semibold text-gray-600">Marka / Model</th>
              <th className="p-4 font-semibold text-gray-600">Kapasite</th>
              <th className="p-4 font-semibold text-gray-600">Kayıt Tarihi</th>
              <th className="p-4 font-semibold text-gray-600 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-800">{v.plateNumber}</td>
                <td className="p-4 text-gray-600">{v.brandAndModel}</td>
                <td className="p-4 text-gray-600">{v.capacity} Kişi</td>
                <td className="p-4 text-gray-600">{new Date(v.createDate).toLocaleDateString('tr-TR')}</td>
                <td className="p-4 text-right">
                  <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ekleme Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Yeni Araç Ekle</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Plaka</label>
                <input required type="text" value={newVehicle.plateNumber} onChange={e => setNewVehicle({...newVehicle, plateNumber: e.target.value})} className="w-full border p-2 rounded-xl" placeholder="34 ABC 123" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Marka & Model</label>
                <input required type="text" value={newVehicle.brandAndModel} onChange={e => setNewVehicle({...newVehicle, brandAndModel: e.target.value})} className="w-full border p-2 rounded-xl" placeholder="Mercedes Sprinter" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kapasite</label>
                <input required type="number" value={newVehicle.seatingCapacity} onChange={e => setNewVehicle({...newVehicle, seatingCapacity: Number(e.target.value)})} className="w-full border p-2 rounded-xl" placeholder="16" min="1" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl">İptal</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 font-semibold rounded-xl hover:bg-blue-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}