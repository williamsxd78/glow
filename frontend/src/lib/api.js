import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// attach admin token if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("glowcamp_admin_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
