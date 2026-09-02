import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Notice } from "@/components/Notice";
import { companyApi, extractErrorMessage } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import type { CompanyUpdatePayload } from "@/types";

const emptyForm: CompanyUpdatePayload = {
  companyName: "",
  address: "",
  phoneNumber: "",
  email: "",
  username: "",
  taxNumber: "",
};

export function CompanyProfile() {
  const { notify } = useToast();
  const [form, setForm] = useState<CompanyUpdatePayload>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<CompanyUpdatePayload>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await companyApi.updateProfile(form);
      notify("Firma bilgileri güncellendi.", "success");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Firma profili"
        description="Firma iletişim bilgilerinizi ve giriş kullanıcı adınızı güncelleyin."
      />

      <Notice>
        Bu formu göndermeden önce mevcut bilgilerinizi kendiniz doldurmanız gerekir — API
        şu an firma profilini tek tek getiren bir uç nokta sunmuyor, bu form doğrudan
        güncelleme (PUT) gönderir.
      </Notice>

      <div className="card card-pad" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="companyName">Firma adı</label>
              <input
                id="companyName"
                required
                minLength={2}
                maxLength={200}
                value={form.companyName}
                onChange={(e) => update({ companyName: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="username">Kullanıcı adı</label>
              <input
                id="username"
                required
                minLength={3}
                maxLength={50}
                value={form.username}
                onChange={(e) => update({ username: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="email">E-posta</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="phoneNumber">Telefon</label>
              <input
                id="phoneNumber"
                required
                value={form.phoneNumber}
                onChange={(e) => update({ phoneNumber: e.target.value })}
                placeholder="+90 5xx xxx xx xx"
              />
            </div>
            <div className="field">
              <label htmlFor="taxNumber">Vergi numarası (opsiyonel)</label>
              <input
                id="taxNumber"
                value={form.taxNumber}
                onChange={(e) => update({ taxNumber: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label htmlFor="address">Adres</label>
              <textarea
                id="address"
                required
                minLength={5}
                maxLength={500}
                rows={3}
                value={form.address}
                onChange={(e) => update({ address: e.target.value })}
              />
            </div>
          </div>

          {error && <p className="field-error" style={{ marginTop: 14 }}>{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner spinner-light" /> : <Save size={14} />}
              Değişiklikleri kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
