import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RoutesPage from './pages/firma/routes';
import FirmaDashboard from './pages/firma/dashboard';
import Drivers from './pages/firma/drivers';
import AdminDashboard from './pages/admin/dashboard';
import Companies from './pages/admin/companies';
import Vehicles from './pages/firma/Vehicles';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Firma Rotaları */}
        <Route path="/firma/dashboard" element={<FirmaDashboard />} />
        <Route path="/firma/vehicles" element={<Vehicles />} />
        <Route path="/firma/drivers" element={<Drivers />} />
        <Route path="/firma/routes" element={<RoutesPage />} />

        {/* Admin Rotaları */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/companies" element={<Companies />} />

        {/* Bilinmeyen rotaları Logine at */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;