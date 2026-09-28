import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerUpload from "./pages/CustomerUpload";
import FreeCustomers from "./pages/FreeCustomers";
import MyCustomers from "./pages/MyCustomers";
import Dashboard from "./pages/Dashboard";
import FollowUpCenter from "./pages/FollowUpCenter";
import Invoices from "./pages/Invoices";
import Login from "./pages/Login";
import Sales from "./pages/Sales";
import SalesAgents from "./pages/SalesAgents";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import AISalesAssistant from "./pages/AISalesAssistant";
import Campaigns from "./pages/Campaigns";
import ReportsCenter from "./pages/ReportsCenter";
import SalesIntelligence from "./pages/SalesIntelligence";
import SalesPipeline, { OpportunityDetails } from "./pages/SalesPipeline";
import TaskPlanner from "./pages/TaskPlanner";
import UploadSales from "./pages/UploadSales";
import Quotations from "./pages/Quotations";
import Payments from "./pages/Payments";
import FinancialReports from "./pages/FinancialReports";
import { ToastHost } from "./components/ui/Toast";
import "./App.css";
import "./premium-global.css";

function Layout() {
  const location=useLocation();
  useEffect(()=>{document.querySelector<HTMLElement>(".mainContent")?.scrollTo({top:0,left:0,behavior:"auto"})},[location.pathname]);
  return (
    <div className="layout">
      <Sidebar />
      <ToastHost />
      <main className="mainContent">
        <Topbar />
        <div className="pageContent">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/my" element={<ProtectedRoute roles={["SALES"]}><MyCustomers /></ProtectedRoute>} />
            <Route path="/customers/free" element={<FreeCustomers />} />
            <Route path="/customers/upload" element={<ProtectedRoute roles={["ADMIN"]}><CustomerUpload /></ProtectedRoute>} />
            <Route path="/customer/:id" element={<CustomerProfile />} />
            <Route path="/customer-upload" element={<Navigate to="/customers/upload" replace />} />
            <Route path="/sales" element={<ProtectedRoute roles={["ADMIN"]}><Sales /></ProtectedRoute>} />
            <Route path="/quotations" element={<ProtectedRoute roles={["ADMIN"]}><Quotations /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute roles={["ADMIN","SALES"]}><Invoices /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute roles={["ADMIN","SALES"]}><Payments /></ProtectedRoute>} />
            <Route path="/financial-reports" element={<ProtectedRoute roles={["ADMIN"]}><FinancialReports /></ProtectedRoute>} />
            <Route path="/follow-ups" element={<ProtectedRoute roles={["ADMIN","SALES"]}><FollowUpCenter /></ProtectedRoute>} />
            <Route path="/follow-up" element={<Navigate to="/follow-ups" replace />} />
            <Route path="/settings" element={<ProtectedRoute roles={["ADMIN"]}><Settings /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute roles={["ADMIN","SALES"]}><SalesAgents /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute roles={["ADMIN"]}><UserManagement /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute roles={["ADMIN"]}><SalesIntelligence /></ProtectedRoute>} />
            <Route path="/ai-assistant" element={<ProtectedRoute roles={["ADMIN"]}><AISalesAssistant /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute roles={["ADMIN"]}><Campaigns /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute roles={["ADMIN"]}><ReportsCenter /></ProtectedRoute>} />
            <Route path="/reports/upload" element={<ProtectedRoute roles={["ADMIN"]}><UploadSales /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute roles={["ADMIN"]}><TaskPlanner /></ProtectedRoute>} />
            <Route path="/pipeline" element={<ProtectedRoute roles={["ADMIN"]}><SalesPipeline /></ProtectedRoute>} />
            <Route path="/pipeline/:id" element={<ProtectedRoute roles={["ADMIN"]}><OpportunityDetails /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute roles={["ADMIN"]}><UploadSales /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
