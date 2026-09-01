import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bus, Users, Map, LogOut, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  role: 'Firma' | 'Admin';
}

export default function DashboardLayout({ children, role }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Role göre menü öğeleri
  const menuItems = role === 'Firma' ? [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/firma/dashboard' },
    { name: 'Araçlar', icon: Bus, path: '/firma/vehicles' },
    { name: 'Şoförler', icon: Users, path: '/firma/drivers' },
    { name: 'Rotalar', icon: Map, path: '/firma/routes' },
  ] : [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Firmalar', icon: Users, path: '/admin/companies' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-xl flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b">
          <div className="bg-blue-600 p-2 rounded-lg"><Bus className="text-white w-6 h-6" /></div>
          <span className="text-lg font-bold text-gray-800">ServisTakip</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                  ? 'bg-blue-50 text-blue-600 font-semibold' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {children}
      </div>
    </div>
  );
}