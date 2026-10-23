import { Link, useNavigate } from "react-router";
import LogoutButton from "#/components/LogoutButton";
import { useEffect, useState } from "react";
import { apiFetch } from "#/shared/api";
import type { Course } from "#/shared/course";
import { Clock, User } from "lucide-react";
import { format, register } from "timeago.js";
import { id_ID } from "timeago.js/lib/lang";

register("id_ID", id_ID);

type HomePageProps = {
  onLogout: () => Promise<void>;
};

const HomePage = ({ onLogout }: HomePageProps) => {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [courseStatus, setCourseStatus] = useState<"loading" | "success">("loading")

  useEffect(() => {
    if (courseStatus === "success") return;

    const load = async () => {
      const resp = await apiFetch("/courses/")
      if (resp.ok) {
        const courses = await resp.json()
        setCourses(courses as Course[])
      }
    }

    load()

    return () => {
      setCourseStatus("success")
    }
  }, [courseStatus, courses])

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      <header className="navbar bg-base-100 shadow-sm border-b border-base-300 px-4 sm:px-8">
        <div className="flex-1">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">
            Swadidik
          </Link>
        </div>
        <div className="flex-none gap-2">
          <LogoutButton onLogout={onLogout} />
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 flex-1">
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
                key={course.courseId}
                className="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-200 border border-base-300 flex flex-col"
              >
                <div className="card-body flex flex-col justify-between">
                  <div className="space-y-3">
                    <h2 className="card-title text-xl font-bold">{course.title}</h2>
                    <span className="flex text-sm"><User className="mr-2" /> {course.authorName}</span>

                    {course.expireAt !== null && (
                      <span className="flex text-sm">
                        <Clock className="mr-2" />
                        {format(course.expireAt, "id_ID")}
                      </span>
                    )}
                    <p className="text-sm text-base-content/70 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="card-actions justify-start mt-6">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        navigate(`/tracks?course_id=${encodeURIComponent(course.courseId)}`, { state: course });
                      }}
                    >
                      Lihat
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
