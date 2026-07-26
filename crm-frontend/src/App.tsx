import {
BrowserRouter,
Navigate,
Route,
Routes
} from "react-router-dom";


import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";


import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";


import "./App.css";



function ProtectedRoute({children}:any){

const token = localStorage.getItem("token");


if(!token){

return <Navigate to="/login"/>;

}


return children;

}



export default function App(){


return (

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


<div className="layout">


<Sidebar/>


<main className="mainContent">


<Topbar/>


<Routes>


<Route
path="/"
element={<Dashboard/>}
/>


<Route
path="/customers"
element={<Customers/>}
/>


</Routes>


</main>


</div>


</ProtectedRoute>


}

/>



</Routes>


</BrowserRouter>

);


}