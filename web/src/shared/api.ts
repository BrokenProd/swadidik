export const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const refreshSession = () =>
  fetch(`${apiBaseUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

export const logoutSession = () =>
  fetch(`${apiBaseUrl}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

export const apiFetch = async (path: string, init: RequestInit = {}) => {
  const request = () =>
    fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
    });

  let response = await request();
  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshSession();
  if (refreshed.ok) {
    response = await request();
  }

  return response;
};
