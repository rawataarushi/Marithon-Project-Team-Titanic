import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Simple icon fix
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

// Calculate distance between two points
function calculateDistance(latLngs) {
  let total = 0;
  for (let i = 0; i < latLngs.length - 1; i++) {
    const [lat1, lng1] = latLngs[i];
    const [lat2, lng2] = latLngs[i + 1];
    const R = 6371; // Earth's radius in km
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

const routes = [
  {
    id: 1,
    name: "Alexandria to New York (Atlantic Route)",
    coordinates: [
      // Alexandria, Egypt
      [31.2001, 29.9187],
      // Mediterranean Sea waypoints
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
    color: "#FF4444",
    style: "solid",
    ports: [
      { name: "Alexandria", position: [31.2001, 29.9187] },
      { name: "Gibraltar", position: [36.1408, -5.3536] },
      { name: "Lisbon", position: [38.7223, -9.1393] },
      { name: "New York", position: [40.7128, -74.0060] }
    ]
  },
  {
    id: 2,
    name: "Alexandria to Singapore (Suez Route)",
    coordinates: [
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
    color: "#4444FF",
    style: "dashed",
    ports: [
      { name: "Alexandria", position: [31.2001, 29.9187] },
      { name: "Suez", position: [30.0444, 31.2357] },
      { name: "Aden", position: [12.7797, 45.0369] },
      { name: "Mumbai", position: [19.0760, 72.8777] },
      { name: "Singapore", position: [1.3521, 103.8198] }
    ]
  }
];

// Custom icons
const startIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const portIcon = L.divIcon({
  className: 'custom-port-marker',
  html: '<div style="background-color: #217A8A; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

export default function SimpleMap() {
  const [visibleRoutes, setVisibleRoutes] = useState({
    1: true,
    2: true
  });

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Route Controls Panel */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        margin: '0 auto',
        maxWidth: '1000px',
        width: '100%'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#217A8A', fontSize: '1.3rem' }}>Maritime Trade Routes</h3>
        
        {/* Route Toggles */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {routes.map(route => (
            <label key={route.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={visibleRoutes[route.id]}
                onChange={(e) => setVisibleRoutes(prev => ({ ...prev, [route.id]: e.target.checked }))}
                style={{ accentColor: route.color }}
              />
              <div style={{
                width: '30px',
                height: '4px',
                background: route.color,
                borderRadius: '2px',
                border: route.style === 'dashed' ? `2px dashed ${route.color}` : 'none',
                backgroundColor: route.style === 'dashed' ? 'transparent' : route.color
              }}></div>
              <span style={{ fontWeight: '500', color: '#34495e' }}>{route.name}</span>
            </label>
          ))}
        </div>

        {/* Route Information */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          {routes.map(route => (
            <div key={route.id} style={{
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '15px',
              border: `2px solid ${route.color}20`
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: route.color, fontSize: '1.1rem' }}>{route.name}</h4>
              <div style={{ fontSize: '0.9rem', color: '#626C71', lineHeight: '1.5' }}>
                <div><strong>Total Waypoints:</strong> {route.coordinates.length}</div>
                <div><strong>Distance:</strong> {calculateDistance(route.coordinates).toFixed(0)} km</div>
                <div><strong>Major Ports:</strong> {route.ports.map(p => p.name).join(', ')}</div>
                <div><strong>Route Type:</strong> {route.style === 'solid' ? 'Direct Atlantic' : 'Suez Canal'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ 
        width: '100%', 
        height: '600px', 
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        margin: '0 auto',
        maxWidth: '1000px'
      }}>
        <MapContainer
          center={[20, 50]}
          zoom={2}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {routes.map(route => 
            visibleRoutes[route.id] ? (
              <React.Fragment key={route.id}>
                {/* Route Line */}
                <Polyline
                  positions={route.coordinates}
                  pathOptions={{ 
                    color: route.color, 
                    weight: 4,
                    opacity: 0.8,
                    dashArray: route.style === 'dashed' ? '10, 10' : undefined
                  }}
                >
                  <Tooltip sticky>
                    <strong>{route.name}</strong><br/>
                    {route.coordinates.length} waypoints<br/>
                    {calculateDistance(route.coordinates).toFixed(0)} km
                  </Tooltip>
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: route.color }}>{route.name}</h4>
                      <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Waypoints:</strong> {route.coordinates.length}</p>
                      <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Distance:</strong> {calculateDistance(route.coordinates).toFixed(0)} km</p>
                      <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Ports:</strong> {route.ports.map(p => p.name).join(', ')}</p>
                    </div>
                  </Popup>
                </Polyline>
                
                {/* Port Markers */}
                {route.ports.map((port, index) => (
                  <Marker
                    key={`${route.id}-port-${index}`}
                    position={port.position}
                    icon={index === 0 || index === route.ports.length - 1 ? startIcon : portIcon}
                  >
                    <Popup>
                      <div style={{ minWidth: '150px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#217A8A' }}>{port.name}</h4>
                        <p style={{ margin: '4px 0', fontSize: '12px', color: index === 0 ? '#28a745' : index === route.ports.length - 1 ? '#dc3545' : '#217A8A', fontWeight: 'bold' }}>
                          {index === 0 ? '🚢 Start Port' : index === route.ports.length - 1 ? '🏁 End Port' : '⚓ Major Port'}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '12px' }}>Route: {route.name}</p>
                        <p style={{ margin: '4px 0', fontSize: '12px' }}>Coordinates: {port.position[0].toFixed(4)}, {port.position[1].toFixed(4)}</p>
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
