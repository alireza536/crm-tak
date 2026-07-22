import "./Topbar.css";

import {
  FaBell,
  FaCog,
  FaSearch,
} from "react-icons/fa";

import profile from "../assets/profile.jpg";

export default function Topbar() {

  const today = new Date().toLocaleDateString("fa-IR");

  return (

    <div className="topbar">

      <div>

        <h1>

          سلام علیرضا 👋

        </h1>

        <p>

          امروز {today}

        </p>

      </div>

      <div className="topbarRight">

        <div className="searchBox">

          <FaSearch />

          <input

            placeholder="جستجوی مشتری..."

          />

        </div>

        <div className="iconButton">

          <FaBell />

        </div>

        <div className="iconButton">

          <FaCog />

        </div>

        <img

          src={profile}

          className="topbarProfile"

        />

      </div>

    </div>

  );

}