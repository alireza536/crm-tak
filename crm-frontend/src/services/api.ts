import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://crm-tak.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
});

export default api;

export async function getDashboard(): Promise<any> {
  const response = await api.get("/dashboard");
  return response.data;
}

export async function getSalesChart(): Promise<any[]> {
  const response = await api.get("/dashboard/sales-chart");
  return response.data;
}

export async function getInvoices(): Promise<any[]> {
  const response = await api.get("/invoice");
  return response.data;
}

export async function getCustomers(): Promise<any[]> {
  const response = await api.get("/user/customers");
  return response.data;
}

export async function getCustomerProfile(id: number): Promise<any> {
  const response = await api.get(`/user/profile/${id}`);
  return response.data;
}

export async function uploadCustomers(file: File): Promise<any> {
  const formData = new FormData();

  // نام file باید با FileInterceptor('file') در بک‌اند یکی باشد
  formData.append("file", file);

  const response = await api.post("/excel/upload", formData);

  return response.data;
}