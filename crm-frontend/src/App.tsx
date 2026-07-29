import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import SalesIntelligence from "./pages/SalesIntelligence";
import FollowUpCenter from "./pages/FollowUpCenter";
import AISalesAssistant from "./pages/AISalesAssistant";
import ReportsCenter from "./pages/ReportsCenter";
import TaskPlanner from "./pages/TaskPlanner";
import SalesPipeline from "./pages/SalesPipeline";
import Inventory from "./pages/Inventory";
import UploadSales from "./pages/UploadSales";
import Settings from "./pages/Settings";
import Campaigns from "./pages/Campaigns";

import "./App.css";


function ProtectedRoute({children}:{children:React.ReactNode}){

const token = localStorage.getItem("token");

if(!token){
return <Navigate to="/login" replace />;
}

return <>{children}</>;

}



function Layout(){

return(

<div className="layout">

<Sidebar/>

<main className="mainContent">

<Topbar/>

<div className="pageContent">

<Routes>


<Route path="/" element={<Dashboard/>}/>


<Route path="/customers" element={<Customers/>}/>


<Route path="/invoices" element={<Invoices/>}/>


<Route path="/insights" element={<SalesIntelligence/>}/>


<Route path="/ai-assistant" element={<AISalesAssistant/>}/>


<Route path="/follow-ups" element={<FollowUpCenter/>}/>


<Route path="/follow-up" element={<FollowUpCenter/>}/>


<Route path="/campaigns" element={<Campaigns/>}/>


<Route path="/reports" element={<ReportsCenter/>}/>


<Route path="/tasks" element={<TaskPlanner/>}/>


<Route path="/pipeline" element={<SalesPipeline/>}/>


<Route path="/inventory" element={<Inventory/>}/>


<Route path="/upload" element={<UploadSales/>}/>


<Route path="/settings" element={<Settings/>}/>


<Route path="*" element={<Navigate to="/" replace/>}/>


</Routes>

</div>

</main>

</div>

)

}




export default function App(){

return(

<BrowserRouter>

<Routes>


<Route
path="/login"
element={<Login/>}
/>


<Route

path="/*"

element={

<ProtectedRoute>

<Layout/>

</ProtectedRoute>

}

/>


</Routes>

</BrowserRouter>

)

}