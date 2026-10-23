import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Clock, User } from "lucide-react";
import { format, register } from "timeago.js";
import { id_ID } from "timeago.js/lib/lang";
import { apiFetch } from "#/shared/api";
import LogoutButton from "#/components/LogoutButton";
import type { Course } from "#/shared/course";

type Track = {
  uuid: string;
  order: number;
  title: string;
};

type ListTrackPageProps = {
  onLogout: () => Promise<void>;
};

register("id_ID", id_ID);

const ListTrackPage = ({ onLogout }: ListTrackPageProps) => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("course_id");

  const navigate = useNavigate()
  const [courseMeta, setCourseMeta] = useState(useLocation().state as (Course | null))

  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    if (courseMeta !== null) return

    const load = async () => {
      const resp = await apiFetch(`/courses/${courseId}`)
      if (resp.ok) {
        const body = await resp.json()
        setCourseMeta(body as Course)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!courseId) return;

    let cancelled = false;

    const load = async () => {
      setStatus("loading");
      try {
        const response = await apiFetch(
          `/tracks/?course_id=${encodeURIComponent(courseId)}`,
          { method: "GET" },
        );
        if (!response.ok) throw new Error(String(response.status));

        const data = (await response.json()) as Track[];
        if (cancelled) return;

        setTracks([...data].sort((a, b) => a.order - b.order));
        setStatus("success");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      <header className="navbar bg-base-100 shadow-sm border-b border-base-300 px-4 sm:px-8">
        <div className="flex-1">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">
            Swadidik
          </Link>
        </div>
        <div className="flex-none flex items-center gap-2">
          <Link to="/" className="btn btn-ghost btn-sm">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
          <LogoutButton onLogout={onLogout} />
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 flex-1">
        {!courseId && (
          <div role="alert" className="alert alert-error">
            <span>ID kursus diperlukan.</span>
          </div>
        )}

        {courseId && status === "loading" && (
          <div className="size-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-xl font-semibold">Memuat Materi...</p>
            </div>
          </div>
        )}

        {courseId && status === "error" && (
          <div role="alert" className="alert alert-error">
            <span>Tidak dapat memuat materi. Coba lagi.</span>
          </div>
        )}

        {courseId && status === "success" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)] items-start">
            <section className="card bg-base-100 border border-base-300 shadow-md">
              <div className="card-body gap-4">
                <h1 className="card-title text-2xl">{courseMeta?.title}</h1>
                <span className="flex text-sm">
                  <User className="mr-2" /> {courseMeta?.authorName}
                </span>
                {courseMeta?.expireAt && (
                  <span className="flex text-sm">
                    <Clock className="mr-2" />
                    {format(courseMeta?.expireAt, "id_ID")}
                  </span>
                )}
                <p className="mb-4">{courseMeta?.description}</p>
                <div className="card-actions justify-start pb-4">
                  <button
                    className="btn btn-md btn-primary"
                    onClick={() => {
                      navigate(`/workspace?course_id=${courseMeta?.courseId}`, { state: { tracks, } })
                    }}>Ikuti</button>
                </div>
              </div>
            </section>

            <section className="card bg-base-100 border border-base-300 shadow-md">
              <div className="card-body gap-4">
                <h2 className="card-title text-xl">Daftar Materi</h2>
                {tracks.length === 0 ? (
                  <p className="text-base-content/70">
                    Kursus ini belum memiliki materi.
                  </p>
                ) : (
                  <ul className="divide-y divide-base-300">
                    {tracks.map((t) => (
                      <li
                        key={t.uuid}
                        className="block px-1 py-2 text-sm transition-colors hover:bg-base-200"
                      >
                        {t.order}. {t.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div >
  );
};

export default ListTrackPage;
