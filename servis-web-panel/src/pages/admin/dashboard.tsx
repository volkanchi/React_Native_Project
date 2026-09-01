import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Building2, BarChart3, Users } from 'lucide-react';
import { api } from '../../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ companies: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const res = await api.get('/Company');
        if (isMounted && res.data.success) {
          const items = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
          setStats({ companies: items.length });
        }
      } catch (error) {
        console.error('Dashboard verileri yüklenemedi', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const cards = [
    { label: 'Toplam Firma', value: loading ? '...' : stats.companies, icon: Building2, color: 'bg-blue-100 text-blue-600' },
    { label: 'Sistem Durumu', value: 'Aktif', icon: BarChart3, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Sunucu', value: 'Render', icon: Users, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <DashboardLayout role="Admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Yönetici Dashboard</h1>
          <p className="text-gray-500 mt-1">Sistem genel görünümü ve operasyon takibi.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <h2 className="text-3xl font-bold text-gray-800 mt-2">{value}</h2>
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}