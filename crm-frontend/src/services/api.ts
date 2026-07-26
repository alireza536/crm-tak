import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://crm-tak.onrender.com";


const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
});


// ارسال خودکار توکن
api.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;

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

  formData.append("file", file);

  const response = await api.post(
    "/excel/upload",
    formData
  );

  return response.data;
}


export async function uploadSalesInvoice(
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<any> {

  const formData = new FormData();

  formData.append("file", file);


  const response = await api.post(
    "/sales/upload",
    formData,
    {
      onUploadProgress:(event)=>{

        if(!event.total || !onProgress)
          return;

        onProgress(
          Math.round(
            (event.loaded * 100) / event.total
          )
        );

      }
    }
  );


  return response.data;
}