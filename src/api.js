import axios from "axios";

// For Kubernetes: use relative paths (routed via Ingress)
// For local Docker with nginx: set VITE_API_BASE_URL to http://localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const identityApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`
});

export const userApi = axios.create({
  baseURL: `${API_BASE_URL}/users`
});

export const eventApi = axios.create({
  baseURL: `${API_BASE_URL}/events`
});

export const bookingApi = axios.create({
  baseURL: `${API_BASE_URL}/bookings`
});

export const chatbotApi = axios.create({
  baseURL: `${API_BASE_URL}/chatbot`
});

export const setAuthToken = (token) => {
  const header = token ? `Bearer ${token}` : "";
  identityApi.defaults.headers.common.Authorization = header;
  userApi.defaults.headers.common.Authorization = header;
  bookingApi.defaults.headers.common.Authorization = header;
  eventApi.defaults.headers.common.Authorization = header;
};
