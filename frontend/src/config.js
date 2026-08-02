// Centralized API configuration.
// Use Vite environment variable VITE_API_URL for deployment.
export const API_URL = import.meta.env.VITE_API_URL || "https://fintrack-backend-ng00.onrender.com";
export const API_BASE = `${API_URL}/api`;
