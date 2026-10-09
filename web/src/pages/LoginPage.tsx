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
        <main className="min-h-screen bg-[#f7f8fc] p-4 sm:p-6 lg:p-8">
            <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
                <div className="w-full max-w-md">
                    <div className="mb-10 lg:hidden">
                        <div className="flex items-center gap-3 text-lg font-bold text-[#182a51]">
                            Swadidik
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="mb-2 text-sm font-semibold text-[#18a991]">
                            SELAMAT DATANG KEMBALI
                        </p>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            Masuk ke akunmu
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            Masukkan detail akunmu untuk melanjutkan belajar.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">
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
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#23b79f] focus:ring-4 focus:ring-[#23b79f]/10"
                                />
                            </span>
                        </label>

                        <label className="block">
                            <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                                Kata sandi
                                <a
                                    href="#forgot-password"
                                    className="font-medium text-[#159d88] hover:text-[#0e7969]"
                                >
                                    Lupa kata sandi?
                                </a>
                            </span>
                            <span className="relative block">
                                <LockKeyhole
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={19}
                                />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Masukkan kata sandi"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#23b79f] focus:ring-4 focus:ring-[#23b79f]/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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

                        {error && (
                            <p
                                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-12 w-full rounded-xl bg-[#182a51] text-sm font-semibold text-white shadow-lg shadow-[#182a51]/20 transition hover:bg-[#223968] focus:outline-none focus:ring-4 focus:ring-[#182a51]/20 disabled:cursor-wait disabled:opacity-70"
                        >
                            {isSubmitting ? "Memeriksa akun..." : "Masuk"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500">
                        Belum punya akun?{" "}
                        <Link
                            to="/register"
                            className="font-semibold text-[#159d88] hover:text-[#0e7969]"
                        >
                            Buat akun
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
};

export default LoginPage;
