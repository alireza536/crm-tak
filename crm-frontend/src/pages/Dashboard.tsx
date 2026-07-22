import Topbar from "../components/Topbar";
import Cards from "../components/Cards";
import SalesChart from "../components/SalesChart";
import RecentInvoices from "../components/RecentInvoices";

import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard">

      <Topbar />

      <Cards />

      <div className="dashboardGrid">

        <SalesChart />

        <RecentInvoices />

      </div>

    </div>
  );
}