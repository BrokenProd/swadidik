import { useState } from "react";
import { UserRoundArrowLeft } from "lucide-react";

type LogoutButtonProps = {
  onLogout: () => Promise<void>;
};

const LogoutButton = ({ onLogout }: LogoutButtonProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

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
    <div className="relative">
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
          <>
            <UserRoundArrowLeft />
            Keluar
          </>
        )}
      </button>

      {logoutError && (
        <div
          role="alert"
          className="absolute right-0 top-full z-10 mt-2 w-max max-w-72 rounded-box bg-error px-3 py-2 text-sm text-error-content shadow-md"
        >
          {logoutError}
        </div>
      )}
    </div>
  );
};

export default LogoutButton;
