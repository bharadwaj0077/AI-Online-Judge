import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🟩 SOFTEN LOGGING: Use console.warn or handle quietly so background guest lookups 
    // don't trigger the aggressive Next.js developer overlay screen.
    const fallbackMessage = error.response?.data?.message || "An unexpected network anomaly occurred.";
    
    if (error.response?.status !== 404 && error.response?.status !== 401) {
      console.warn("🌐 Background Network Note:", fallbackMessage);
    }
    
    return Promise.reject(error);
  }
);