import axios from "axios";
import { clearStoredAuth } from "../utils/auth";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if ((status === 401 || status === 403) && !window.location.pathname.startsWith("/login")) {
      clearStoredAuth();
      window.location.replace("/login");
      return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
