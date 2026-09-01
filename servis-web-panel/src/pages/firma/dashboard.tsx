import { useEffect, useState } from 'react';
import { api } from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import { Bus, Map, Users, TrendingUp } from 'lucide-react';

type Stats = {
  vehicles: number;
  drivers: number;
  routes: number;
};

export default function FirmaDashboard() {
  const [stats, setStats] = useState<Stats>({ vehicles: 0, drivers: 0, routes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [vehiclesRes, driversRes, routesRes] = await Promise.allSettled([
          api.get('/Vehicles'),
          api.get('/Company/drivers'),
          api.get('/Route'),
        ]);

        setStats({
          vehicles: vehiclesRes.status === 'fulfilled' && Array.isArray(vehiclesRes.value?.data?.data)
            ? vehiclesRes.value.data.data.length
            : 0,
          drivers: driversRes.status === 'fulfilled' && Array.isArray(driversRes.value?.data?.data)
            ? driversRes.value.data.data.length
            : 0,
          routes: routesRes.status === 'fulfilled' && Array.isArray(routesRes.value?.data?.data)
            ? routesRes.value.data.data.length
            : 0,
        });
      } catch (error) {
        console.error('Dashboard verileri yüklenemedi', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const cards = [
    { label: 'Toplam Araç', value: stats.vehicles, icon: Bus, color: 'bg-blue-100 text-blue-600' },
    { label: 'Toplam Şoför', value: stats.drivers, icon: Users, color: 'bg-amber-100 text-amber-600' },
    { label: 'Toplam Rota', value: stats.routes, icon: Map, color: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <DashboardLayout role="Firma">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Firma Dashboard</h1>
          <p className="text-gray-500 mt-1">Operasyonel genel görünümünüz.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <h2 className="text-3xl font-bold text-gray-800 mt-2">{loading ? '...' : value}</h2>
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-violet-100 text-violet-600 p-2 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">İşlem Özeti</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-800">Araç yönetimi</p>
              <p className="mt-1">Araç ekleme, silme ve güncelleme işlemleri tek ekrandan yönetilir.</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-800">Şoför yönetimi</p>
              <p className="mt-1">Şoför bilgileri ve araç atamaları kolayca takip edilir.</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-800">Rota planlama</p>
              <p className="mt-1">Rotalar oluşturulup düzenlenebilir ve aktif durum için yönetilebilir.</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-800">İzleme</p>
              <p className="mt-1">Operasyonel veriler ve sistem genel görünümü tek ekranda izlenir.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
