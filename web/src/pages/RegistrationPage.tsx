import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiBaseUrl } from "#/shared/api";

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (!name || !email || !password || !confirmation) {
      setError("Lengkapi semua data untuk membuat akun.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi harus terdiri dari minimal 8 karakter.");
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi kata sandi belum sesuai.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(data?.error || "Gagal mendaftar. Silakan coba lagi.");
        return;
      }
      navigate("/login", { replace: true });
    } catch {
      setError("Terjadi kesalahan jaringan. Periksa koneksi Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="hero min-h-screen bg-base-200 p-4">
      <div className="hero-content w-full max-w-md flex-col">
        <div className="text-center mb-2">
          <Link to="/" className="text-2xl font-bold text-primary tracking-tight">
            Swadidik
          </Link>
        </div>

        <div className="card w-full bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="mb-2">
              <span className="badge badge-primary badge-soft text-xs font-semibold uppercase tracking-wider mb-2">
                Mulai Sekarang
              </span>
              <h1 className="card-title text-2xl font-bold">Buat akun baru</h1>
              <p className="text-sm text-base-content/70 mt-1">
                Daftar gratis dan mulai perjalanan belajarmu hari ini.
              </p>
            </div>

            <form className="space-y-4 mt-2" onSubmit={handleSubmit} noValidate>
              <fieldset className="fieldset">
                <legend className="fieldset-legend font-medium">Nama</legend>
                <label className="input flex items-center gap-2 w-full">
                  <UserRound className="size-4 opacity-70" />
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Nama lengkap"
                    className="grow"
                  />
                </label>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-medium">Email</legend>
                <label className="input flex items-center gap-2 w-full">
                  <Mail className="size-4 opacity-70" />
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@email.com"
                    className="grow"
                  />
                </label>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-medium">Kata sandi</legend>
                <label className="input flex items-center gap-2 w-full">
                  <LockKeyhole className="size-4 opacity-70" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimal 8 karakter"
                    className="grow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn btn-ghost btn-circle btn-xs opacity-70 hover:opacity-100"
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </label>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend font-medium">
                  Konfirmasi kata sandi
                </legend>
                <label className="input flex items-center gap-2 w-full">
                  <LockKeyhole className="size-4 opacity-70" />
                  <input
                    name="confirmation"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Ulangi kata sandi"
                    className="grow"
                  />
                </label>
              </fieldset>

              {error && (
                <div role="alert" className="alert alert-error text-sm py-2">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full mt-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Mendaftar...
                  </>
                ) : (
                  "Buat akun"
                )}
              </button>
            </form>

            <div className="divider text-xs text-base-content/50">atau</div>

            <p className="text-center text-sm text-base-content/70">
              Sudah punya akun?{" "}
              <Link to="/login" className="link link-primary font-semibold">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegistrationPage;
