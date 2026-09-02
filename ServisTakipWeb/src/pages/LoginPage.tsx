import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { extractErrorMessage } from "@/lib/api";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === "Admin" ? "/admin" : "/company"} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const decoded = await login(email, password);
      if (decoded.role !== "Firma" && decoded.role !== "Admin") {
        setError(
          "Bu panel yalnızca Firma ve Admin hesapları içindir. Yolcu/Şoför hesapları mobil uygulamayı kullanmalıdır."
        );
        return;
      }
      navigate(decoded.role === "Admin" ? "/admin" : "/company", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-side">
        <div className="auth-side-brand">
          <div className="sidebar-brand-mark">ST</div>
          <div className="sidebar-brand-text" style={{ fontSize: 17 }}>
            ServisTakip
          </div>
        </div>

        <svg className="auth-route-graphic" viewBox="0 0 380 200" fill="none">
          <path
            d="M20 160 C 90 40, 150 180, 220 90 S 340 30, 360 60"
            stroke="#F2A93B"
            strokeWidth="2.5"
            strokeDasharray="1 10"
            strokeLinecap="round"
          />
          <circle cx="20" cy="160" r="5" fill="#F2A93B" />
          <circle cx="220" cy="90" r="3.5" fill="#8b95b3" />
          <circle cx="360" cy="60" r="5" fill="#F2A93B" />
          <rect x="8" y="148" width="24" height="24" rx="6" fill="none" stroke="#F2A93B" strokeWidth="1.4" opacity="0.6" />
        </svg>

        <p className="auth-side-quote">
          Firmanızın servis araçlarını, şoförlerini ve güzergahlarını{" "}
          <span>tek bir yerden</span> yönetin.
        </p>
      </div>

      <div className="auth-form-col">
        <div className="auth-form-card">
          <h1>Panele giriş yap</h1>
          <p>Firma veya yönetici hesabınızla oturum açın.</p>

          <form onSubmit={handleSubmit}>
            <div className="field field-full" style={{ marginBottom: 14 }}>
              <label htmlFor="email">E-posta</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="firma@ornek.com"
              />
            </div>
            <div className="field field-full" style={{ marginBottom: 8 }}>
              <label htmlFor="password">Şifre</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="field-error" style={{ marginTop: 10 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: "100%", justifyContent: "center", marginTop: 18 }}
            >
              {submitting ? <span className="spinner spinner-light" /> : <LogIn size={15} />}
              Giriş yap
            </button>
          </form>

          <div className="auth-switch">
            Firmanız için ilk kayıt bir yönetici tarafından yapılır — hesabınız yoksa
            yöneticinizle iletişime geçin.
          </div>
        </div>
      </div>
    </div>
  );
}
