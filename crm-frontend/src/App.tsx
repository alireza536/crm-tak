import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import UploadSales from "./pages/UploadSales";
import Invoices from "./pages/Invoices";
import Sms from "./pages/Sms";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerUpload from "./pages/CustomerUpload";
import Settings from "./pages/Settings";

import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">

        <Sidebar />

        <main className="mainContent">
          <Routes>
<Route path="/sms" element={<Sms />} />
            <Route path="/" element={<Dashboard />} />
            <Route
  path="/settings"
  element={<Settings />}
/>

            <Route path="/customers" element={<Customers />} />

            <Route path="/upload" element={<UploadSales />} />

            <Route path="/invoices" element={<Invoices />} />
            <Route
  path="/customer-upload"
  element={<CustomerUpload />}
/>

            <Route
              path="/customer/:id"
              element={<CustomerProfile />}
            />

          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}