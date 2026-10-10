import {
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiBaseUrl } from "#/shared/api";

const inputClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#23b79f] focus:ring-4 focus:ring-[#23b79f]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const RegistrationPage = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
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
        }
    };


    return (
        <main className="min-h-screen bg-[#f7f8fc] p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
            <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
                <div className="w-full max-w-md">
                    <div className="mb-8 flex items-center gap-3 text-lg font-bold text-[#182a51] dark:text-slate-100 lg:hidden">
                        Swadidik
                    </div>
                    <div className="mb-7">
                        <p className="mb-2 text-sm font-semibold text-[#18a991]">
                            MULAI SEKARANG
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            Buat akun baru
                        </h1>
                        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Daftar gratis dan mulai perjalanan belajarmu hari ini.
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Nama
                            </span>
                            <span className="relative block">
                                <UserRound
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={19}
                                />
                                <input
                                    name="name"
                                    autoComplete="name"
                                    placeholder="Nama"
                                    className={inputClass}
                                />
                            </span>
                        </label>
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Email
                            </span>
                            <span className="relative block">
                                <Mail
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={19}
                                />
                                <input
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                    className={inputClass}
                                />
                            </span>
                        </label>
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Kata sandi
                            </span>
                            <span className="relative block">
                                <LockKeyhole
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={19}
                                />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Minimal 8 karakter"
                                    className={`${inputClass} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    aria-label={
                                        showPassword
                                            ? "Sembunyikan kata sandi"
                                            : "Tampilkan kata sandi"
                                    }
                                >
                                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                </button>
                            </span>
                        </label>
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Konfirmasi kata sandi
                            </span>
                            <span className="relative block">
                                <LockKeyhole
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={19}
                                />
                                <input
                                    name="confirmation"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Ulangi kata sandi"
                                    className={inputClass}
                                />
                            </span>
                        </label>
                        {error && (
                            <p
                                className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            className="h-12 w-full rounded-xl bg-[#182a51] text-sm font-semibold text-white shadow-lg shadow-[#182a51]/20 transition hover:bg-[#223968]"
                        >
                            Buat akun
                        </button>
                    </form>
                    <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
                        Sudah punya akun?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-[#159d88] hover:text-[#0e7969]"
                        >
                            Masuk
                        </Link>
                    </p>
                </div>
            </section>
        </main >
    );
};

export default RegistrationPage;
