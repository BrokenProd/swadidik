import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import { logoutSession, refreshSession } from "#/shared/api";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import WorkspacePage from "./pages/WorkspacePage";

function App() {
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
      <div className="grid h-screen place-items-center bg-[#f7f8fc] text-sm text-slate-500">
        Memuat sesi...
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Routes>
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<HomePage onLogout={handleLogout} />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage onAuthenticated={() => setIsAuthenticated(true)} />}
      />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
