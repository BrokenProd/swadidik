import { Link } from "react-router";

const MainNavbar = () => {
  return (
    <header className="navbar bg-base-100 shadow-sm border-b border-base-300 px-4 sm:px-8">
      <div className="flex-1">
        <Link to="/" className="text-xl font-bold text-primary tracking-tight">
          Swadidik
        </Link>
      </div>
      <div className="flex-none gap-2">
        <Link to="/login" className="btn btn-ghost btn-sm">
          Masuk
        </Link>
        <Link to="/register" className="btn btn-primary btn-sm">
          Daftar
        </Link>
      </div>
    </header>
  );
};

export default MainNavbar;

