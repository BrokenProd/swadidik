import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle2 } from "lucide-react";

type Course = {
  title: string;
  description: string;
  level: string;
  uuid: string;
};

const courses: Course[] = [
  {
    title: "Dasar-Dasar Python",
    description:
      "Kenali sintaks, variabel, percabangan, dan perulangan melalui latihan singkat.",
    level: "Pemula",
    uuid: "0afe55a4-d2d4-4223-bd84-f26b87a9440c",
  },
  {
    title: "Pemrograman Java",
    description:
      "Bangun pemahaman tentang tipe data, class, dan object pada Java.",
    level: "Pemula",
    uuid: "0afe55a4-d2d4-4223-bd84-f26b87a9440c",
  },
];

type HomePageProps = {
  onLogout: () => Promise<void>;
};

const HomePage = ({ onLogout }: HomePageProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const navigate = useNavigate()

  const handleLogout = async () => {
    setLogoutError("");
    setIsLoggingOut(true);

    try {
      await onLogout();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Tidak dapat keluar dari akun. Coba lagi.",
      );
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      <header className="navbar bg-base-100 shadow-sm border-b border-base-300 px-4 sm:px-8">
        <div className="flex-1">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">
            Swadidik
          </Link>
        </div>
        <div className="flex-none gap-2">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="btn btn-ghost btn-sm"
          >
            {isLoggingOut ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                Keluar...
              </>
            ) : (
              "Keluar"
            )}
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 flex-1">
        {logoutError && (
          <div role="alert" className="alert alert-error mb-6 shadow-sm">
            <span>{logoutError}</span>
          </div>
        )}

        <section className="space-y-8">
          <div>
            <span className="badge badge-primary badge-soft text-xs font-semibold uppercase tracking-wider mb-2">
              Belajar Sesuai Kecepatanmu
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Pilih kursus untuk mulai belajar
            </h1>
            <p className="text-base-content/70 mt-2 max-w-2xl text-sm sm:text-base">
              Pilih jalur pembelajaran mandiri yang dirancang untuk membantu Anda
              menguasai konsep pemrograman langkah demi langkah.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.title}
                className="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-200 border border-base-300 flex flex-col"
              >
                <div className="card-body flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="badge badge-success badge-soft badge-sm gap-1 font-medium">
                      <CheckCircle2 size={13} aria-hidden="true" />
                      {course.level}
                    </div>
                    <h2 className="card-title text-xl font-bold">{course.title}</h2>
                    <p className="text-sm text-base-content/70 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="card-actions justify-end mt-6">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        navigate(`/workspace?uuid=${course.uuid}&track=1`);
                      }}
                    >
                      Enter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
