// src/WorldMap.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./WorldMap.css";

// Import marker images explicitly
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon issue with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ROUTES = [
  {
    id: "route1",
    name: "Alexandria to New York (Atlantic Route)",
    waypoints: [
      // Alexandria, Egypt
      [31.2001, 29.9187],
      // Mediterranean Sea
      [31.5, 30.2], [32.0, 31.0], [32.8, 32.5], [33.5, 33.8], [34.2, 34.9],
      // Gibraltar Strait
      [36.1408, -5.3536],
      // Atlantic Ocean - European Coast
      [36.5, -6.5], [37.2, -8.1], [38.7, -9.4], [40.6, -8.9],
      // Lisbon, Portugal
      [38.7223, -9.1393],
      // Atlantic crossing waypoints
      [39.0, -12.0], [40.0, -15.0], [41.0, -20.0], [42.0, -25.0],
      [43.0, -30.0], [44.0, -35.0], [45.0, -40.0], [46.0, -45.0],
      [47.0, -50.0], [46.5, -55.0], [45.5, -60.0], [44.0, -65.0],
      [42.5, -68.0], [41.0, -70.0], [40.0, -72.0],
      // New York, USA
      [40.7128, -74.0060]
    ],
    style: "solid",
    color: "#FF4444",
    ports: [
      { name: "Alexandria", position: [31.2001, 29.9187] },
      { name: "Gibraltar", position: [36.1408, -5.3536] },
      { name: "Lisbon", position: [38.7223, -9.1393] },
      { name: "New York", position: [40.7128, -74.0060] }
    ]
  },
  {
    id: "route2",
    name: "Alexandria to Singapore (Suez Route)",
    waypoints: [
      // Alexandria, Egypt
      [31.2001, 29.9187],
      // Suez Canal
      [30.8025, 32.2735], [30.5944, 32.2631], [30.0444, 31.2357],
      // Red Sea
      [27.2583, 33.8116], [25.0, 35.0], [22.0, 36.5], [20.0, 37.5],
      [18.0, 38.8], [16.0, 40.0], [14.0, 41.5], [12.6302, 43.1462],
      // Aden, Yemen
      [12.7797, 45.0369],
      // Arabian Sea
      [12.0, 48.0], [11.5, 52.0], [12.0, 56.0], [13.0, 60.0],
      [15.0, 64.0], [17.0, 68.0], [18.9750, 72.8258],
      // Mumbai, India
      [19.0760, 72.8777],
      // Indian Ocean
      [18.0, 75.0], [16.0, 78.0], [14.0, 82.0], [12.0, 86.0],
      [10.0, 90.0], [8.0, 94.0], [6.0, 98.0], [4.0, 101.0],
      [2.0, 103.0],
      // Singapore
      [1.3521, 103.8198]
    ],
    style: "dotted",
    color: "#4444FF",
    ports: [
      { name: "Alexandria", position: [31.2001, 29.9187] },
      { name: "Suez", position: [30.0444, 31.2357] },
      { name: "Aden", position: [12.7797, 45.0369] },
      { name: "Mumbai", position: [19.0760, 72.8777] },
      { name: "Singapore", position: [1.3521, 103.8198] }
    ]
  }
];

const startIcon = new L.DivIcon({
  className: "custom-marker start-marker",
  html: '<div style="background-color: #28a745; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});
const endIcon = new L.DivIcon({
  className: "custom-marker end-marker",
  html: '<div style="background-color: #dc3545; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function calculateDistance(latLngs) {
  let total = 0;
  for (let i = 0; i < latLngs.length - 1; i++) {
    const [lat1, lng1] = latLngs[i];
    const [lat2, lng2] = latLngs[i + 1];
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }
  return total;
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  return null;
}

export default function WorldMap() {
  const [visibleRoutes, setVisibleRoutes] = useState({
    route1: true,
    route2: true
  });

  const allLatLngs = ROUTES.flatMap(route => route.waypoints);
  const bounds = L.latLngBounds(allLatLngs);

  // Create port icons
  const portIcon = new L.DivIcon({
    className: "custom-marker port-marker",
    html: '<div style="background-color: #217A8A; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Panel */}
      <div className="panel" style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
        <div className="panel-section">
          <div className="panel-title">Route Controls</div>
          <div className="route-toggles">
            {ROUTES.map(route => (
              <label key={route.id}>
                <input
                  type="checkbox"
                  checked={visibleRoutes[route.id]}
                  onChange={e =>
                    setVisibleRoutes(v => ({
                      ...v,
                      [route.id]: e.target.checked
                    }))
                  }
                />
                <span
                  className={
                    "route-indicator " +
                    (route.style === "solid"
                      ? "route-indicator--solid"
                      : "route-indicator--dotted")
                  }
                ></span>
                {route.name}
              </label>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-title">Route Information</div>
          <div>
            {ROUTES.map(route => (
              <div className="route-info__item" key={route.id}>
                <h4>{route.name}</h4>
                <div className="route-info__detail">
                  Waypoints: <span>{route.waypoints.length}</span>
                </div>
                <div className="route-info__detail">
                  Status: <span className="status">Active</span>
                </div>
                <div className="route-info__detail">
                  Distance: <span>{calculateDistance(route.waypoints).toFixed(0)} km</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-title">Legend</div>
          <div className="legend">
            <div className="legend-item">
              <div className="route-indicator route-indicator--solid"></div>
              <span>Solid Route (Route 1)</span>
            </div>
            <div className="legend-item">
              <div className="route-indicator route-indicator--dotted"></div>
              <span>Dotted Route (Route 2)</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker legend-marker--start"></div>
              <span>Start Point</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker legend-marker--end"></div>
              <span>End Point</span>
            </div>
          </div>
        </div>
      </div>
      {/* Map */}
      <div className="map-container">
        <MapContainer
          center={[20, 50]}
          zoom={2}
          minZoom={1}
          maxZoom={18}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds bounds={bounds} />

          {ROUTES.map(route =>
            visibleRoutes[route.id] ? (
              <React.Fragment key={route.id}>
                <Polyline
                  positions={route.waypoints}
                  pathOptions={{
                    color: route.color,
                    weight: 4,
                    opacity: 0.8,
                    dashArray: route.style === "dotted" ? "10, 15" : undefined
                  }}
                >
                  <Tooltip sticky direction="center">
                    <strong>{route.name}</strong>
                    <br />
                    Click for details
                  </Tooltip>
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <h4
                        style={{
                          margin: "0 0 8px 0",
                          color: "#217A8A",
                          fontSize: 14,
                          fontWeight: 600
                        }}
                      >
                        {route.name}
                      </h4>
                      <p style={{ margin: 4, fontSize: 12, color: "#626C71" }}>
                        <strong>Route ID:</strong> {route.id}
                      </p>
                      <p style={{ margin: 4, fontSize: 12, color: "#626C71" }}>
                        <strong>Style:</strong> {route.style}
                      </p>
                      <p style={{ margin: 4, fontSize: 12, color: "#626C71" }}>
                        <strong>Waypoints:</strong> {route.waypoints.length}
                      </p>
                      <p style={{ margin: 4, fontSize: 12, color: "#626C71" }}>
                        <strong>Distance:</strong>{" "}
                        {calculateDistance(route.waypoints).toFixed(0)} km (approx.)
                      </p>
                    </div>
                  </Popup>
                </Polyline>
                
                {/* Port Markers */}
                {route.ports && route.ports.map((port, index) => (
                  <Marker
                    key={`${route.id}-port-${index}`}
                    position={port.position}
                    icon={index === 0 ? startIcon : index === route.ports.length - 1 ? endIcon : portIcon}
                    title={port.name}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <h4
                          style={{
                            margin: "0 0 8px 0",
                            color: "#217A8A",
                            fontSize: 14,
                            fontWeight: 600
                          }}
                        >
                          {port.name}
                        </h4>
                        <p
                          style={{
                            margin: 4,
                            fontSize: 12,
                            color: index === 0 ? "#28a745" : index === route.ports.length - 1 ? "#dc3545" : "#217A8A",
                            fontWeight: 600
                          }}
                        >
                          {index === 0 ? "📍 Start Port" : index === route.ports.length - 1 ? "🏁 End Port" : "⚓ Major Port"}
                        </p>
                        <p style={{ margin: 4, fontSize: 12, color: "#626C71" }}>
                          Route: {route.name}
                        </p>
                        <p style={{ margin: 4, fontSize: 12, color: "#626C71" }}>
                          Lat: {port.position[0].toFixed(4)}
                        </p>
                        <p style={{ margin: 4, fontSize: 12, color: "#626C71" }}>
                          Lng: {port.position[1].toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                    <Tooltip direction="top">{port.name}</Tooltip>
                  </Marker>
                ))}
              </React.Fragment>
            ) : null
          )}
        </MapContainer>
      </div>
    </div>
  );
}
