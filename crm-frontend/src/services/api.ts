import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://crm-tak.onrender.com";


const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
});


api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if(token){
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error)=>{
    return Promise.reject(error);
  }
);


export default api;


export async function getDashboard(){
  const res = await api.get("/dashboard");
  return res.data;
}


export async function getSalesChart(){
  const res = await api.get("/dashboard/sales-chart");
  return res.data;
}


export async function getInvoices(){
  const res = await api.get("/invoice");
  return res.data;
}


export async function getCustomers(){
  const res = await api.get("/user/customers");
  return res.data;
}
export async function getCustomerProfile(id:number){
  const res = await api.get(`/user/profile/${id}`);
  return res.data;
}


export async function uploadCustomers(file:File){

  const formData = new FormData();

  formData.append("file",file);

  const res = await api.post(
    "/excel/upload",
    formData
  );

  return res.data;
}
export async function getNotifications(){

 const res = await api.get("/notifications");

 return res.data;

}


export async function uploadSalesInvoice(
  file:File,
  onProgress?:(p:number)=>void
){

  const formData = new FormData();

  formData.append("file",file);


  const res = await api.post(
    "/sales/upload",
    formData,
    {
      onUploadProgress:(event)=>{

        if(event.total && onProgress){

          onProgress(
            Math.round(
              event.loaded * 100 / event.total
            )
          );

        }

      }
    }
  );


  return res.data;
}