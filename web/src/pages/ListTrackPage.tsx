import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "#/shared/api";

type Track = {
  uuid: string;
  track: number;
  title: string;
  course_id: string;
};

const ListTrackPage = () => {
  const [searchParams] = useSearchParams();
  const uuid = searchParams.get("uuid");

  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!uuid) return;

    let cancelled = false;

    const load = async () => {
      setStatus("loading");
      try {
        const response = await apiFetch(
          `/tracks/?uuid=${encodeURIComponent(uuid)}`,
          { method: "GET" },
        );
        if (!response.ok) throw new Error(String(response.status));

        const data = (await response.json()) as Track[];
        if (cancelled) return;

        setTracks([...data].sort((a, b) => a.track - b.track));
        setStatus("success");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [uuid]);

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      <header className="navbar bg-base-100 shadow-sm border-b border-base-300 px-4 sm:px-8">
        <div className="flex-1">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">
            Swadidik
          </Link>
        </div>
        <Link to="/" className="btn btn-ghost btn-sm">
          <ArrowLeft className="size-4" />
          Kembali ke Daftar
        </Link>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8 sm:py-12 flex-1">
        {!uuid && (
          <div role="alert" className="alert alert-error">
            <span>ID kursus diperlukan.</span>
          </div>
        )}

        {uuid && status === "loading" && (
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner text-primary" />
            <span>Memuat materi...</span>
          </div>
        )}

        {uuid && status === "error" && (
          <div role="alert" className="alert alert-error">
            <span>Tidak dapat memuat materi. Coba lagi nanti.</span>
          </div>
        )}

        {uuid && status === "success" && (
          <section className="card bg-base-100 border border-base-300 shadow-md">
            <div className="card-body gap-4">
              <h1 className="card-title text-2xl">Daftar materi</h1>

              {tracks.length === 0 ? (
                <p className="text-base-content/70">
                  Kursus ini belum memiliki materi.
                </p>
              ) : (
                <ul className="divide-y divide-base-300">
                  {tracks.map((t) => (
                    <li key={t.uuid}>
                      <Link
                        to={`/workspace?uuid=${uuid}&track=${t.track}`}
                        className="block py-2 px-1 text-sm hover:bg-base-200 transition-colors"
                      >
                        {t.track}. {t.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ListTrackPage;