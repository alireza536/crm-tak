import axios from "axios";
import { clearSession, getAccessToken, getCurrentUser, type AuthUser } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? "https://crm-tak.onrender.com" : "http://localhost:3001");

const api = axios.create({ baseURL: API_URL, timeout: 120000 });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) clearSession();
    if (typeof window !== "undefined" && String(error.config?.url || "").startsWith("/payments")) {
      const message = error.response?.data?.message;
      window.dispatchEvent(new CustomEvent("tak-toast", { detail: { type: "error", text: Array.isArray(message) ? message.join("، ") : message || "عملیات پرداخت انجام نشد" } }));
    }
    return Promise.reject(error);
  },
);

export type LoginResponse = {
  access_token: string;
  id: number;
  name: string;
  role: "ADMIN" | "SALES";
  message: string;
};

export async function login(phone: string, password: string) {
  const response = await api.post<LoginResponse>("/auth/login", { phone, password });
  return response.data;
}

export async function getRoleDashboard() {
  const user = getCurrentUser();
  if (!user) throw new Error("No authenticated user");
  const endpoint = user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/sales";
  return (await api.get(endpoint)).data;
}

export async function getDashboard() {
  const data = await getRoleDashboard();
  if (getCurrentUser()?.role === "ADMIN") {
    return {
      customers: data.summary?.totalCustomers ?? 0,
      sales: data.summary?.totalRevenue ?? 0,
      profit: 0,
      sms: 0,
    };
  }
  return {
    customers: data.summary?.assignedCustomers ?? 0,
    sales: data.summary?.personalRevenue ?? 0,
    profit: 0,
    sms: 0,
  };
}

export async function getSalesChart() {
  return (await api.get("/dashboard/sales-chart")).data;
}

export async function getInvoices() {
  const rows = (await api.get<Array<Omit<InvoiceRecord,"user"> & {user:InvoiceRecord["user"]|null}>>("/invoices")).data;
  return rows.map(row=>({...row,user:row.user||{id:0,name:"بدون کارشناس"}}));
}

export type InvoiceItem={productName:string;quantity:number;unitPrice:number;discount:number;totalPrice:number};
export type InvoiceRecord={id:number;customerId:number;userId:number|null;invoiceNumber:string;total:number;invoiceDate:string|null;items:InvoiceItem[]|null;status:"PENDING"|"PAID"|"CANCELLED";createdAt:string;customer:{id:number;name:string;phone:string|null};user:{id:number;name:string}};
export async function createInvoice(payload:{customerId:number;userId?:number;invoiceNumber?:string;total:number;items?:InvoiceItem[];status?:string}){return(await api.post<InvoiceRecord>("/invoices",payload)).data}
export async function updateInvoice(id:number,payload:Partial<{customerId:number;userId:number;invoiceNumber:string;total:number;items:InvoiceItem[];status:string}>){return(await api.put<InvoiceRecord>(`/invoices/${id}`,payload)).data}
export async function deleteInvoice(id:number){return(await api.delete(`/invoices/${id}`)).data}
export async function getInvoice(id:number){return(await api.get<InvoiceRecord>(`/invoices/${id}`)).data}

export type PaymentStatus="PENDING"|"COMPLETED"|"FAILED"|"CANCELLED";
export type PaymentRecord={id:number;invoiceId:number;customerId:number;userId:number;amount:number;paymentDate:string;paymentMethod:string;description:string|null;status:PaymentStatus;createdAt:string;invoice:InvoiceRecord;customer:{id:number;name:string;phone:string};user:{id:number;name:string}};
export async function getPayments(){return(await api.get<PaymentRecord[]>("/payments")).data}
export async function getInvoicePayments(invoiceId:number){return(await api.get<PaymentRecord[]>(`/payments/invoice/${invoiceId}`)).data}
export async function createPayment(payload:{invoiceId:number;amount:number;paymentDate:string;paymentMethod:string;description?:string;status?:PaymentStatus}){const data=(await api.post<PaymentRecord>("/payments",payload)).data;window.dispatchEvent(new CustomEvent("tak-toast",{detail:{type:"success",text:"پرداخت با موفقیت ثبت شد"}}));return data}
export async function updatePayment(id:number,payload:Partial<Pick<PaymentRecord,"amount"|"paymentDate"|"paymentMethod"|"description"|"status">>){const data=(await api.patch<PaymentRecord>(`/payments/${id}`,payload)).data;window.dispatchEvent(new CustomEvent("tak-toast",{detail:{type:"success",text:"پرداخت با موفقیت ویرایش شد"}}));return data}
export async function deletePayment(id:number){const data=(await api.delete(`/payments/${id}`)).data;window.dispatchEvent(new CustomEvent("tak-toast",{detail:{type:"success",text:"پرداخت با موفقیت حذف شد"}}));return data}
export type FinancialSummary={dailySales:number;monthlySales:number;yearlySales:number;totalInvoices:number;totalIssued:number;totalPaid:number;totalDebt:number};
export type FinancialChartPoint={date:string;sales:number;invoices:number};
export async function getFinancialSummary(startDate?:string,endDate?:string){return(await api.get<FinancialSummary>("/financial-reports/summary",{params:{startDate,endDate}})).data}
export async function getFinancialChart(startDate?:string,endDate?:string){return(await api.get<FinancialChartPoint[]>("/financial-reports/chart",{params:{startDate,endDate}})).data}

export async function getCustomers() {
  return (await api.get("/customers")).data;
}

export type CustomerImportRow = {
  rowNumber: number;
  name: string;
  storeName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  nationalCode: string;
  status: string;
  customerType: string;
  errors: string[];
};

export async function previewCustomerImport(file: File, onProgress?: (progress: number) => void) {
  const formData = new FormData();
  formData.append("file", file);
  return (await api.post<{
    fileName: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    rows: CustomerImportRow[];
  }>("/customers/import/preview", formData, {
    timeout: 0,
    onUploadProgress: event => {
      if (event.total && onProgress) onProgress(Math.round((event.loaded * 100) / event.total));
    },
  })).data;
}

export async function importCustomers(payload: { fileName: string; rows: CustomerImportRow[] }) {
  return (await api.post<{
    importId: number;
    totalRows: number;
    importedRows: number;
    failedRows: number;
    errors: Array<{ row: number; message: string }>;
    createdCustomers: Array<{ id: number; name: string; phone: string }>;
  }>("/customers/import", payload, {timeout:0})).data;
}

export async function getFreeCustomers() {
  return (await api.get<Array<{id:number;name:string;phone:string|null;city:string|null;address:string|null;nationalCode:string|null;createdAt:string}>>("/customers/free")).data;
}

export async function claimCustomer(id: number) {
  return (await api.patch(`/customers/${id}/claim`)).data;
}

export async function getSalesUsers() {
  const users = (await api.get<Array<{ id: number; name: string; phone: string; role: string }>>("/users")).data;
  return users.filter(user => user.role === "SALES");
}

export async function getCustomerProfile(id: number) {
  return (await api.get(`/customers/${id}`)).data;
}

export async function getSales() {
  return (await api.get("/sales")).data;
}

export type QuotationStatus="DRAFT"|"SENT"|"APPROVED"|"REJECTED"|"EXPIRED";
export type QuotationItem={id?:number;productName:string;quantity:number;unitPrice:number;discount:number;totalPrice?:number};
export type QuotationRecord={id:number;customerId:number;userId:number;quotationNumber:string;quotationDate:string;description:string|null;items:QuotationItem[];subtotal:number;discount:number;tax:number;totalAmount:number;status:QuotationStatus;validUntil:string|null;createdAt:string;invoiceId:number|null;convertedAt:string|null;invoice?:{id:number;invoiceNumber:string}|null;customer:{id:number;name:string;phone:string};user:{id:number;name:string}};
export type QuotationPayload={customerId:number;userId?:number;quotationNumber?:string;quotationDate?:string;description?:string;items:QuotationItem[];discount:number;tax:number;validUntil?:string|null;status?:QuotationStatus};
export async function getQuotations(){return(await api.get<QuotationRecord[]>("/quotations")).data}
export async function getCustomerQuotations(customerId:number){return(await api.get<QuotationRecord[]>(`/quotations/customer/${customerId}`)).data}
export async function createQuotation(payload:QuotationPayload){return(await api.post<QuotationRecord>("/quotations",payload)).data}
export async function updateQuotation(id:number,payload:Partial<QuotationPayload>){return(await api.put<QuotationRecord>(`/quotations/${id}`,payload)).data}
export async function deleteQuotation(id:number){return(await api.delete(`/quotations/${id}`)).data}
export async function approveQuotation(id:number){return(await api.post(`/quotations/${id}/approve`)).data}
export async function rejectQuotation(id:number){return(await api.post<QuotationRecord>(`/quotations/${id}/reject`)).data}
export async function convertQuotationToInvoice(id:number){return(await api.post<{quotation:QuotationRecord;invoice:{id:number;invoiceNumber:string}}>(`/quotations/${id}/convert`)).data}

export type FollowUpType="CALL"|"WHATSAPP"|"MEETING"|"QUOTE"|"PAYMENT"|"OTHER";
export type FollowUpStatus="PENDING"|"DONE"|"CANCELLED"|"OVERDUE";
export type FollowUpRecord={id:number;customerId:number;userId:number;type:FollowUpType;title:string;description:string|null;status:FollowUpStatus;dueDate:string;completedAt:string|null;createdAt:string;customer:{id:number;name:string;phone:string};user:{id:number;name:string}};
export async function getFollowUps(){return(await api.get<FollowUpRecord[]>("/followups")).data}
export async function getCustomerFollowUps(customerId:number){return(await api.get<FollowUpRecord[]>(`/followups/customer/${customerId}`)).data}
export async function createFollowUp(payload:{customerId:number;userId?:number;type:FollowUpType;title:string;description?:string;dueDate:string;status?:FollowUpStatus}){return(await api.post<FollowUpRecord>("/followups",payload)).data}
export async function updateFollowUp(id:number,payload:Partial<Pick<FollowUpRecord,"type"|"title"|"description"|"status"|"dueDate">>){return(await api.patch<FollowUpRecord>(`/followups/${id}`,payload)).data}
export async function deleteFollowUp(id:number){return(await api.delete(`/followups/${id}`)).data}

export async function createSale(payload: {
  customerId: number;
  productName: string;
  quantity: number;
  amount: number;
  userId?: number;
}) {
  return (await api.post("/sales", payload)).data;
}

export async function uploadCustomers(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return (await api.post("/excel/upload", formData)).data;
}

export async function getNotifications() {
  return [];
}

export async function uploadSalesInvoice(file: File, onProgress?: (progress: number) => void) {
  const formData = new FormData();
  formData.append("file", file);
  return (await api.post("/sales/upload", formData, {
    onUploadProgress: (event) => {
      if (event.total && onProgress) onProgress(Math.round((event.loaded * 100) / event.total));
    },
  })).data;
}

export type SalesReportType = "DAILY" | "MONTHLY" | "YEARLY" | "CUSTOM";
export type SalesReportRow = {
  rowNumber: number; date: string; invoiceNumber: string; customerName: string;
  customerPhone: string; productCode: string; productName: string; quantity: number; amount: number;
  errors: string[];
};

export async function previewSalesReport(file: File, reportType: SalesReportType, onProgress?: (progress: number) => void, mapping?: Record<string,string>) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("reportType", reportType);
  if (mapping) formData.append("mapping", JSON.stringify(mapping));
  return (await api.post<{
    fileName: string; reportType: SalesReportType; totalRows: number; validRows: number;
    invalidRows: number; rows: SalesReportRow[]; groups: Array<{ period: string; sales: number; revenue: number }>;
    headers: string[]; mapping: Record<string,string>; missingColumns: string[];
    analysis: { customer: boolean; date: boolean; product: boolean; amount: boolean };
  }>("/reports/preview", formData, { onUploadProgress: event => {
    if (event.total && onProgress) onProgress(Math.round((event.loaded * 100) / event.total));
  }})).data;
}

export async function importSalesReport(payload: { fileName: string; reportType: SalesReportType; rows: SalesReportRow[] }, onProgress?: (progress: number) => void) {
  return (await api.post<{
    importId: number; reportType: SalesReportType; totalRows: number;
    importedRows: number; failedRows: number; errors: Array<{ row: number; message: string }>;
  }>("/reports/import", payload, { onUploadProgress: event => {
    if (event.total && onProgress) onProgress(Math.round((event.loaded * 85) / event.total));
  }})).data;
}

export type SalesImportHistory = {
  id:number; fileName:string; reportType:SalesReportType;
  uploadedBy:{id:number;name:string}|null; totalRows:number; importedRows:number;
  failedRows:number; status:"SUCCESS"|"PARTIAL"|"FAILED"; createdAt:string;
  errors:Array<{row:number;message:string}>;
};

export async function getSalesImportHistory() {
  return (await api.get<SalesImportHistory[]>("/reports/imports")).data;
}

export async function downloadSalesImportSample() {
  const response = await api.get<Blob>("/reports/sample", { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = "TAK-CRM-sales-import-sample.xlsx"; anchor.click();
  URL.revokeObjectURL(url);
}

const reportParams = (startDate?: string, endDate?: string) => ({
  params: { ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) },
});

export async function getReportSummary(startDate?: string, endDate?: string) {
  return (await api.get<{
    totalSalesAmount: number; totalInvoices: number; totalCustomers: number; totalProducts: number;
  }>("/reports/summary", reportParams(startDate, endDate))).data;
}

export async function getReportCharts(startDate?: string, endDate?: string) {
  type Point={key:string;label:string;revenue:number;invoices:number};
  return (await api.get<{
    dailySales: Point[]; monthlySales: Point[]; yearlySales: Point[];
    salespersonPerformance: Array<{userId:number;name:string;revenue:number;sales:number}>;
    customerRanking: Array<{customerId:number;name:string;revenue:number;sales:number}>;
  }>("/reports/chart", reportParams(startDate, endDate))).data;
}

export function userFromLogin(data: LoginResponse): AuthUser {
  return { id: data.id, name: data.name, role: data.role };
}

export default api;
