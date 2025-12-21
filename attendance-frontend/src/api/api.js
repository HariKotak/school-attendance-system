import axios from "axios";

const api = axios.create({
  baseURL: "https://attendance-backend-hxdy.onrender.com/api", // Django backend
});

export default api;
