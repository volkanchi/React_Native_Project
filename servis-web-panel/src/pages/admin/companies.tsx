import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import { Pencil, Plus, Trash2 } from 'lucide-react';

type Company = {
  id: string;
  companyName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  address?: string;
};

type CompanyForm = {
  companyName: string;
  address: string;
  phoneNumber: string;
  email: string;
  username: string;
  password?: string;
};

const emptyCompany: CompanyForm = {
  companyName: '',
  address: '',
  phoneNumber: '',
  email: '',
  username: '',
  password: '',
};

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState<CompanyForm>(emptyCompany);
  const [editingCompany, setEditingCompany] = useState<(CompanyForm & { id: string }) | null>(null);

  const loadCompanies = async () => {
    try {
      const res = await api.get('/Company');
      const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setCompanies(items);
    } catch (error) {
      console.error('Firmalar yüklenemedi', error);
      setCompanies([]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/Company');
        if (isMounted) {
          const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
          setCompanies(items);
        }
      } catch (error) {
        console.error('Firmalar yüklenemedi', error);
        if (isMounted) setCompanies([]);
      }
    };
    
    fetchCompanies();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/Company/register', newCompany);
      setIsModalOpen(false);
      setNewCompany(emptyCompany);
      await loadCompanies();
    } catch (error) {
      console.error('Firma eklenirken hata oluştu', error);
      alert('Firma eklenirken hata oluştu');
    }
  };

  const handleDelete = async (companyId: string) => {
    try {
      if (!window.confirm('Bu firmayı silmek istediğinize emin misiniz?')) return;
      await api.delete(`/Company/delete-company/${companyId}`);
      await loadCompanies();
    } catch (error) {
      console.error('Firma silinirken hata oluştu', error);
      alert('Firma silinirken hata oluştu');
    }
  };

  const handleEditClick = (company: Company) => {
    setEditingCompany({
      id: company.id,
      companyName: company.companyName,
      address: company.address ?? '',
      phoneNumber: company.phoneNumber ?? '',
      email: company.email,
      username: company.username,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    try {
      await api.put(`/Company/update`, {
        companyName: editingCompany.companyName,
        address: editingCompany.address,
        phoneNumber: editingCompany.phoneNumber,
        email: editingCompany.email,
        username: editingCompany.username,
      });
      setIsEditModalOpen(false);
      setEditingCompany(null);
      await loadCompanies();
    } catch (error) {
      console.error('Firma güncellenirken hata oluştu', error);
      alert('Firma güncellenirken hata oluştu');
    }
  };

  return (
    <DashboardLayout role="Admin">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Firma Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Sistemdeki firmaları yönetin.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> Yeni Firma Ekle
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Firma Adı</th>
              <th className="p-4 font-semibold text-gray-600">Kullanıcı</th>
              <th className="p-4 font-semibold text-gray-600">E-posta</th>
              <th className="p-4 font-semibold text-gray-600">Telefon</th>
              <th className="p-4 font-semibold text-gray-600 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Kayıtlı firma bulunamadı.</td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{company.companyName}</td>
                  <td className="p-4 text-gray-600">{company.username}</td>
                  <td className="p-4 text-gray-600">{company.email}</td>
                  <td className="p-4 text-gray-600">{company.phoneNumber ?? '-'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => handleEditClick(company)} className="bg-orange-100 text-orange-600 hover:bg-orange-200 p-2 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(company.id)} className="bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded-lg transition-colors">
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

      {/* Yeni Firma Ekle Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Yeni Firma Ekle</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Firma Adı</label>
                <input required type="text" value={newCompany.companyName} onChange={e => setNewCompany({ ...newCompany, companyName: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Adres</label>
                <textarea required value={newCompany.address} onChange={e => setNewCompany({ ...newCompany, address: e.target.value })} className="w-full border p-2 rounded-xl" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                <input required type="text" value={newCompany.phoneNumber} onChange={e => setNewCompany({ ...newCompany, phoneNumber: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-posta</label>
                <input required type="email" value={newCompany.email} onChange={e => setNewCompany({ ...newCompany, email: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kullanıcı Adı</label>
                <input required type="text" value={newCompany.username} onChange={e => setNewCompany({ ...newCompany, username: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Şifre</label>
                <input required type="password" value={newCompany.password} onChange={e => setNewCompany({ ...newCompany, password: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl">İptal</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 font-semibold rounded-xl hover:bg-blue-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Firma Güncelleme Modalı */}
      {isEditModalOpen && editingCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Firma Güncelle</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Firma Adı</label>
                <input required type="text" value={editingCompany.companyName} onChange={e => setEditingCompany({ ...editingCompany, companyName: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Adres</label>
                <textarea required value={editingCompany.address} onChange={e => setEditingCompany({ ...editingCompany, address: e.target.value })} className="w-full border p-2 rounded-xl" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                <input required type="text" value={editingCompany.phoneNumber} onChange={e => setEditingCompany({ ...editingCompany, phoneNumber: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-posta</label>
                <input required type="email" value={editingCompany.email} onChange={e => setEditingCompany({ ...editingCompany, email: e.target.value })} className="w-full border p-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kullanıcı Adı</label>
                <input required type="text" value={editingCompany.username} onChange={e => setEditingCompany({ ...editingCompany, username: e.target.value })} className="w-full border p-2 rounded-xl" />
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