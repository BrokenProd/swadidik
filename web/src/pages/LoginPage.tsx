import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { apiBaseUrl } from "#/shared/api";

type LoginPageProps = {
  onAuthenticated: () => void;
};

const LoginPage = ({ onAuthenticated }: LoginPageProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Masukkan email dan kata sandi untuk melanjutkan.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Email atau kata sandi tidak valid.");
      }

      onAuthenticated();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Tidak dapat terhubung ke server. Coba lagi.",
      );
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
                Selamat Datang Kembali
              </span>
              <h1 className="card-title text-2xl font-bold">Masuk ke akunmu</h1>
              <p className="text-sm text-base-content/70 mt-1">
                Masukkan detail akunmu untuk melanjutkan belajar.
              </p>
            </div>

            <form className="space-y-4 mt-2" onSubmit={handleSubmit} noValidate>
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
                <div className="flex justify-between items-center w-full">
                  <legend className="fieldset-legend font-medium">Kata sandi</legend>
                  <a
                    href="#forgot-password"
                    className="link link-primary link-hover text-xs"
                  >
                    Lupa kata sandi?
                  </a>
                </div>
                <label className="input flex items-center gap-2 w-full">
                  <LockKeyhole className="size-4 opacity-70" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
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
                    Memeriksa akun...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>

            <div className="divider text-xs text-base-content/50">atau</div>

            <p className="text-center text-sm text-base-content/70">
              Belum punya akun?{" "}
              <Link to="/register" className="link link-primary font-semibold">
                Buat akun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
