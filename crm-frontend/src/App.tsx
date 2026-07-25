import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import UploadSales from "./pages/UploadSales";
import Invoices from "./pages/Invoices";
import Sms from "./pages/Sms";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerUpload from "./pages/CustomerUpload";
import Settings from "./pages/Settings";
import SalesIntelligence from "./pages/SalesIntelligence";
import AISalesAssistant from "./pages/AISalesAssistant";
import FollowUpCenter from "./pages/FollowUpCenter";
import CampaignCenter from "./pages/CampaignCenter";
import ReportsCenter from "./pages/ReportsCenter";
import TaskPlanner from "./pages/TaskPlanner";
import SalesPipeline from "./pages/SalesPipeline";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import "./App.css";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <main className="mainContent">
          <Topbar />
          <Routes>
            <Route
 path="/login"
 element={
   token
   ?
   <Navigate to="/" />
   :
   <Login />
 }
/>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customer/:id" element={<CustomerProfile />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/insights" element={<SalesIntelligence />} />
            <Route path="/ai-assistant" element={<AISalesAssistant />} />
            <Route path="/follow-ups" element={<FollowUpCenter />} />
            <Route path="/campaigns" element={<CampaignCenter />} />
            <Route path="/reports" element={<ReportsCenter />} />
            <Route path="/tasks" element={<TaskPlanner />} />
            <Route path="/pipeline" element={<SalesPipeline />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/upload" element={<UploadSales />} />
            <Route path="/customer-upload" element={<CustomerUpload />} />
            <Route path="/sms" element={<Sms />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
