import React from "react";
import ReactDOM from "react-dom/client";
import './index.css';
import StatTrackerApp from "./StatTrackerApp";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <StatTrackerApp />
  </React.StrictMode>
);