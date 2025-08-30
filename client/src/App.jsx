import React from "react";
import SimpleMap from "./SimpleMap";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <div className="header">
        <h1>Maritime Trade Routes - World Map</h1>
        <p>
          Historic maritime trade routes connecting Alexandria to major global ports across all continents
        </p>
      </div>
      <div className="main-content">
        <SimpleMap />
      </div>
      <div className="footer">
        &copy; 2025 Maritime Shipping Routes. Interactive visualization of global shipping routes.
      </div>
    </div>
  );
}

export default App;
