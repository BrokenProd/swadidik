import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

type Course = {
  title: string;
  description: string;
  level: string;
};

const courses: Course[] = [
  {
    title: "Dasar-Dasar Python",
    description: "Kenali sintaks, variabel, percabangan, dan perulangan melalui latihan singkat.",
    level: "Pemula",
  },
  {
    title: "JavaScript untuk Pemula",
    description: "Pelajari fondasi JavaScript untuk membangun interaksi di halaman web.",
    level: "Pemula",
  },
  {
    title: "Pemrograman Java",
    description: "Bangun pemahaman tentang tipe data, class, dan object pada Java.",
    level: "Pemula",
  },
];

type HomePageProps = {
  onLogout: () => Promise<void>;
};

const HomePage = ({ onLogout }: HomePageProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLogoutError("");
    setIsLoggingOut(true);

    try {
      await onLogout();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Tidak dapat keluar dari akun. Coba lagi.",
      );
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <span className="text-lg font-bold text-[#182a51]">Swadidik</span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-slate-500 sm:inline">Ruang belajarku</span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#182a51] transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
            >
              {isLoggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </div>
      </header>

      {logoutError && (
        <p className="mx-auto mt-4 max-w-6xl px-5 text-sm text-red-600 sm:px-8" role="alert">
          {logoutError}
        </p>
      )}

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold tracking-wide text-[#159d88]">
            BELAJAR SESUAI KECEPATANMU
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#182a51] sm:text-4xl">
            Pilih kursus untuk mulai belajar
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Semua materi dirancang untuk dipelajari langkah demi langkah dan dipraktikkan langsung di workspace.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            return (
              <article
                key={course.title}
                className="flex min-h-72 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                    <CheckCircle2 size={16} className="text-[#18a991]" aria-hidden="true" />
                    {course.level}
                  </div>
                  <h2 className="text-xl font-bold text-[#182a51]">{course.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{course.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default HomePage;
