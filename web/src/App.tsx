import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { logoutSession, refreshSession } from "#/shared/api";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import WorkspacePage from "./pages/WorkspacePage";
import ThemeToggle from "./components/ThemeToggle";
import ListTrackPage from "./pages/ListTrackPage";
import LandingPage from "./pages/LandingPage";

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await refreshSession();
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    void restoreSession();
  }, []);

  const handleLogout = async () => {
    const response = await logoutSession();
    if (!response.ok) {
      throw new Error("Tidak dapat keluar dari akun. Coba lagi.");
    }
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <>
        <div className="grid h-screen place-items-center bg-base-200 text-sm text-base-content/70">
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner text-primary" />
            <span>Memuat sesi...</span>
          </div>
        </div>
        <ThemeToggle />
      </>
    );
  }

  if (isAuthenticated) {
    return <>
      <Routes>
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/tracks" element={<ListTrackPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<HomePage onLogout={handleLogout} />} />
      </Routes>
      {!location.pathname.startsWith("/workspace") && <ThemeToggle />}
    </>;
  }

  return <>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={<LoginPage onAuthenticated={() => setIsAuthenticated(true)} />}
      />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ThemeToggle />
  </>;
}

export default App;
