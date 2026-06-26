const API_URL = import.meta.env.PUBLIC_STORIES_API_URL || "http://localhost:8787";
const API_KEY = import.meta.env.PUBLIC_STORIES_API_KEY;
const getPublicHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
});

const getAdminHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  "x-api-key": token || API_KEY,
});

async function apiFetch(path: string, options: RequestInit) {
  try {
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return data;
  } catch (error) {
    return { success: false, error: "Failed to fetch data" };
  }
}

export { apiFetch, getPublicHeaders, getAdminHeaders };
