import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
});


export default api;

export async function getDashboard() {
  const res = await api.get("/dashboard");
  return res.data;
}

export async function getSalesChart() {
  const res = await api.get("/dashboard/sales-chart");
  return res.data;
}

export async function getInvoices() {
  const res = await api.get("/invoice");
  return res.data;
}

export async function getCustomers() {
  const res = await api.get("/user/customers");
  return res.data;
}

export async function getCustomerProfile(id: number) {
  const res = await api.get(`/user/profile/${id}`);
  return res.data;
}
export async function uploadCustomers(file: File) {

  const formData = new FormData();

  formData.append("file", file);

  const res = await fetch(
    "http://localhost:3000/customer/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  return res.json();

}
