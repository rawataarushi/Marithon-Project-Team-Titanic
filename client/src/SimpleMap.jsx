import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import modular components and utilities
import { routes, calculateRouteDistance } from './data/routes';
import { fetchWaypointWeather, getWeatherIcon, getWindArrow, getDirectionName } from './services/weatherService';
import { calculateWeatherAffectedSpeed } from './utils/maritimeCalculations';
import WeatherSpeedDisplay from './components/WeatherSpeedDisplay';
import ShipSimulation from './components/ShipSimulation';

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
  const [error, setError] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const [visibleRoutes, setVisibleRoutes] = useState({
    1: true,
    2: true
  });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [waypointData, setWaypointData] = useState({});
  const [loadingWaypoints, setLoadingWaypoints] = useState({});
  const [selectedRouteForCalculation, setSelectedRouteForCalculation] = useState(null);
  
  // Ship movement simulation states
  const [selectedRouteForSimulation, setSelectedRouteForSimulation] = useState(null);
  const [shipSpeed, setShipSpeed] = useState(20); // knots
  const [shipPosition, setShipPosition] = useState(0); // current waypoint index
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0); // 0 to 100
  const [currentWeatherAffectedSpeed, setCurrentWeatherAffectedSpeed] = useState(0); // current speed affected by weather
  const [currentWaypointWeather, setCurrentWaypointWeather] = useState(null); // current waypoint weather data

  useEffect(() => {
    try {
      console.log('SimpleMap component mounted');
      setIsMapReady(true);
    } catch (err) {
      console.error('Error in SimpleMap useEffect:', err);
      setError(err);
    }
  }, []);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: 'red',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        margin: '20px'
      }}>
        <h2>Map Error</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  if (!isMapReady) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        margin: '20px'
      }}>
        <h2>Loading Map...</h2>
        <p>Please wait while the map initializes.</p>
      </div>
    );
  }

  const handleRouteClick = (route) => {
    setSelectedRoute(selectedRoute?.id === route.id ? null : route);
  };

  // Handle simulation updates from ShipSimulation component
  const handleSimulationUpdate = (simulationData) => {
    console.log('SimpleMap received simulation update:', simulationData);
    
    setIsSimulationRunning(simulationData.isRunning);
    setShipPosition(simulationData.position);
    setSimulationProgress(simulationData.progress);
    setCurrentWeatherAffectedSpeed(simulationData.weatherSpeed);
    
    if (simulationData.weatherData) {
      console.log('Setting currentWaypointWeather:', simulationData.weatherData);
      setCurrentWaypointWeather(simulationData.weatherData);
    }
    
    console.log('Updated states:', {
      isSimulationRunning: simulationData.isRunning,
      shipPosition: simulationData.position,
      simulationProgress: simulationData.progress,
      currentWeatherAffectedSpeed: simulationData.weatherSpeed,
      hasWeatherData: !!simulationData.weatherData
    });
  };

  // Calculate estimated travel time and fuel usage
  const calculateRouteMetrics = (route) => {
    if (!route) return null;
    
    const totalDistance = calculateRouteDistance(route.coordinates);
    const baseSpeed = 20; // Base speed in knots (typical container ship)
    
    // Get average weather conditions from waypoints
    let totalWindSpeed = 0;
    let totalWaveHeight = 0;
    let waypointCount = 0;
    
    route.coordinates.forEach((coord, index) => {
      const waypointId = `${route.id}-waypoint-${index}`;
      const waypointInfo = waypointData[waypointId];
      
      if (waypointInfo && waypointInfo.weather && waypointInfo.ocean) {
        totalWindSpeed += waypointInfo.weather.wind?.speed || 0;
        totalWaveHeight += parseFloat(waypointInfo.ocean.waveHeight) || 0;
        waypointCount++;
      }
    });
    
    const avgWindSpeed = waypointCount > 0 ? totalWindSpeed / waypointCount : 10;
    const avgWaveHeight = waypointCount > 0 ? totalWaveHeight / waypointCount : 1.5;
    
    // Calculate speed adjustments based on conditions
    let speedAdjustment = 1.0;
    
    // Wind impact (headwind reduces speed, tailwind increases)
    if (avgWindSpeed > 15) speedAdjustment *= 0.9; // Strong winds
    else if (avgWindSpeed > 10) speedAdjustment *= 0.95; // Moderate winds
    
    // Wave height impact
    if (avgWaveHeight > 3) speedAdjustment *= 0.8; // High waves
    else if (avgWaveHeight > 2) speedAdjustment *= 0.9; // Moderate waves
    
    // Route type adjustments
    if (route.style === 'dashed') speedAdjustment *= 0.95; // Suez route (more congested)
    
    const adjustedSpeed = baseSpeed * speedAdjustment;
    const travelTimeHours = totalDistance / (adjustedSpeed * 1.852); // Convert knots to km/h
    const travelTimeDays = travelTimeHours / 24;
    
    // Fuel consumption calculation (typical container ship: 150-200 tons per day)
    const baseFuelPerDay = 175; // tons per day
    let fuelAdjustment = 1.0;
    
    // Adjust fuel based on conditions
    if (avgWindSpeed > 15) fuelAdjustment *= 1.15; // High winds increase fuel usage
    if (avgWaveHeight > 3) fuelAdjustment *= 1.2; // High waves increase fuel usage
    if (route.style === 'dashed') fuelAdjustment *= 1.05; // Suez route (more maneuvering)
    
    const totalFuel = baseFuelPerDay * travelTimeDays * fuelAdjustment;
    
    return {
      totalDistance,
      baseSpeed,
      adjustedSpeed,
      travelTimeHours,
      travelTimeDays,
      totalFuel,
      avgWindSpeed,
      avgWaveHeight,
      speedAdjustment,
      fuelAdjustment
    };
  };

  // Fetch weather data for a specific waypoint
  const fetchWaypointWeatherData = async (coord, waypointId) => {
    if (waypointData[waypointId]) {
      return; // Already loaded
    }
    
    setLoadingWaypoints(prev => ({ ...prev, [waypointId]: true }));
    
    try {
      const data = await fetchWaypointWeather(coord, waypointId);
      setWaypointData(prev => ({ ...prev, [waypointId]: data }));
    } catch (error) {
      console.error('Error fetching waypoint data:', error);
      setWaypointData(prev => ({ 
        ...prev, 
        [waypointId]: { error: 'Failed to load data', timestamp: new Date().toISOString() }
      }));
    } finally {
      setLoadingWaypoints(prev => ({ ...prev, [waypointId]: false }));
    }
  };

  const getShipPosition = () => {
    if (!selectedRouteForSimulation || shipPosition >= selectedRouteForSimulation.coordinates.length) {
      return null;
    }
    return selectedRouteForSimulation.coordinates[shipPosition];
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          .ship-simulation-marker {
            animation: ${isSimulationRunning ? 'pulse 1s infinite' : 'none'};
            transition: all 0.3s ease;
          }
          
          .ship-simulation-marker:hover {
            transform: scale(1.2);
            z-index: 1001;
          }
        `}
      </style>
      
      {/* Main Container - Vertical Layout */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px', 
        minHeight: '100vh', 
        boxSizing: 'border-box', 
        padding: '20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        
        {/* Route Controls Panel */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          width: '100%',
          boxSizing: 'border-box'
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
              <div 
                key={route.id} 
                onClick={() => handleRouteClick(route)}
                style={{
                  background: selectedRoute?.id === route.id ? '#f0f8ff' : '#f8fafc',
                  borderRadius: '8px',
                  padding: '15px',
                  border: `2px solid ${selectedRoute?.id === route.id ? route.color : route.color + '20'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: selectedRoute?.id === route.id ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: selectedRoute?.id === route.id ? '0 6px 20px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (selectedRoute?.id !== route.id) {
                    e.target.style.transform = 'scale(1.01)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRoute?.id !== route.id) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: route.color, fontSize: '1.1rem' }}>{route.name}</h4>
                <div style={{ fontSize: '0.9rem', color: '#626C71', lineHeight: '1.5' }}>
                  <div><strong>Total Waypoints:</strong> {route.coordinates.length}</div>
                  <div><strong>Distance:</strong> {calculateRouteDistance(route.coordinates).toFixed(0)} km</div>
                  <div><strong>Major Ports:</strong> {route.ports.map(p => p.name).join(', ')}</div>
                  <div><strong>Route Type:</strong> {route.style === 'solid' ? 'Direct Atlantic' : 'Suez Canal'}</div>
                </div>
                {selectedRoute?.id === route.id && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '15px', 
                    background: '#fff', 
                    borderRadius: '6px', 
                    border: `1px solid ${route.color}40`,
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <h5 style={{ margin: '0 0 10px 0', color: route.color, fontSize: '1rem' }}>Route Waypoints</h5>
                    <div style={{ fontSize: '0.85rem', color: '#555' }}>
                      {route.coordinates.map((coord, index) => (
                        <div key={index} style={{ 
                          padding: '8px', 
                          margin: '4px 0', 
                          background: index === 0 || index === route.coordinates.length - 1 ? '#e8f5e8' : '#f5f5f5',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${index === 0 ? '#28a745' : index === route.coordinates.length - 1 ? '#dc3545' : route.color}`
                        }}>
                          <strong>Waypoint {index + 1}:</strong> {coord[0].toFixed(4)}, {coord[1].toFixed(4)}
                          {index === 0 && <span style={{ color: '#28a745', marginLeft: '8px' }}>🚢 Start</span>}
                          {index === route.coordinates.length - 1 && <span style={{ color: '#dc3545', marginLeft: '8px' }}>🏁 End</span>}
                          {route.ports.find(p => p.position[0] === coord[0] && p.position[1] === coord[1]) && (
                            <span style={{ color: '#217A8A', marginLeft: '8px' }}>⚓ Port</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Map and Weather Speed Display Container */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          width: '100%'
        }}>
          {/* Map Container */}
          <div style={{ 
            flex: '1',
            height: '400px', 
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            boxSizing: 'border-box',
            position: 'relative'
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
                        {calculateRouteDistance(route.coordinates).toFixed(0)} km
                      </Tooltip>
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <h4 style={{ margin: '0 0 8px 0', color: route.color }}>{route.name}</h4>
                          <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Waypoints:</strong> {route.coordinates.length}</p>
                          <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Distance:</strong> {calculateRouteDistance(route.coordinates).toFixed(0)} km</p>
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

                    {/* Ship Marker for Simulation */}
                    {selectedRouteForSimulation?.id === route.id && getShipPosition() && (
                      <Marker
                        key="ship-simulation-marker"
                        position={getShipPosition()}
                        icon={L.divIcon({
                          className: 'ship-simulation-marker',
                          html: `<div style="
                            background-color: #FF6B35;
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            border: 4px solid white;
                            box-shadow: 0 6px 16px rgba(0,0,0,0.8);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 18px;
                            animation: ${isSimulationRunning ? 'pulse 1s infinite' : 'none'};
                            z-index: 1000;
                          ">🚢</div>`,
                          iconSize: [32, 32],
                          iconAnchor: [16, 16]
                        })}
                      >
                        <Popup>
                          <div style={{ minWidth: '200px' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#FF6B35' }}>🚢 Ship Position</h4>
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                              <strong>Route:</strong> {route.name}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                              <strong>Waypoint:</strong> {shipPosition + 1} of {route.coordinates.length}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                              <strong>Progress:</strong> {simulationProgress.toFixed(1)}%
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                              <strong>Base Speed:</strong> {shipSpeed} knots
                            </p>
                            {currentWeatherAffectedSpeed > 0 && (
                              <p style={{ margin: '4px 0', fontSize: '12px', color: '#1976d2' }}>
                                <strong>Weather Speed:</strong> {currentWeatherAffectedSpeed.toFixed(1)} knots
                              </p>
                            )}
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                              <strong>Status:</strong> {isSimulationRunning ? '🔄 Moving' : '⏸️ Stopped'}
                            </p>
                          </div>
                        </Popup>
                        <Tooltip direction="top">
                          🚢 Ship: {currentWeatherAffectedSpeed > 0 ? currentWeatherAffectedSpeed.toFixed(1) : shipSpeed} knots | Waypoint {shipPosition + 1}
                        </Tooltip>
                      </Marker>
                    )}

                    {/* Waypoint Markers */}
                    {route.coordinates.map((coord, index) => {
                      const waypointId = `${route.id}-waypoint-${index}`;
                      const waypointInfo = waypointData[waypointId];
                      const isLoading = loadingWaypoints[waypointId];
                      
                      return (
                        <Marker
                          key={waypointId}
                          position={coord}
                          icon={L.divIcon({
                            className: 'waypoint-marker',
                            html: `<div style="
                              background-color: ${index === 0 ? '#28a745' : index === route.coordinates.length - 1 ? '#dc3545' : route.color};
                              width: 12px;
                              height: 12px;
                              border-radius: 50%;
                              border: 3px solid white;
                              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                              cursor: pointer;
                              transition: all 0.2s ease;
                            " 
                            onmouseover="this.style.transform='scale(1.5)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.6)'"
                            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.4)'"
                            title="Click for weather data"></div>`,
                            iconSize: [18, 18],
                            iconAnchor: [9, 9]
                          })}
                          eventHandlers={{
                            click: () => {
                              fetchWaypointWeatherData(coord, waypointId);
                            }
                          }}
                        >
                          <Popup>
                            <div style={{ minWidth: '280px', maxWidth: '320px' }}>
                              <h4 style={{ margin: '0 0 12px 0', color: route.color, fontSize: '1.1rem', textAlign: 'center' }}>
                                {index === 0 ? '🚢 Start Point' : index === route.coordinates.length - 1 ? '🏁 End Point' : `Waypoint ${index + 1}`}
                              </h4>
                              
                              {/* Basic Info */}
                              <div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
                                <p style={{ margin: '4px 0', fontSize: '12px', fontWeight: 'bold' }}>
                                  Route: {route.name}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}>
                                  <strong>Position:</strong> {index + 1} of {route.coordinates.length}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}>
                                  <strong>Coordinates:</strong> {coord[0].toFixed(4)}, {coord[1].toFixed(4)}
                                </p>
                                {route.ports.find(p => p.position[0] === coord[0] && p.position[1] === coord[1]) && (
                                  <p style={{ margin: '4px 0', fontSize: '12px', color: '#217A8A', fontWeight: 'bold' }}>
                                    ⚓ Major Port Location
                                  </p>
                                )}
                              </div>

                              {/* Weather and Ocean Data */}
                              {isLoading && (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                  <div style={{ fontSize: '16px', color: '#666' }}>Loading weather data...</div>
                                </div>
                              )}

                              {waypointInfo && !isLoading && !waypointInfo.error && (
                                <div>
                                  {/* Weather Section */}
                                  <div style={{ marginBottom: '15px', padding: '10px', background: '#e3f2fd', borderRadius: '6px' }}>
                                    <h5 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: '14px' }}>🌤️ Weather Conditions</h5>
                                    {waypointInfo.weather && (
                                      <div style={{ fontSize: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                          <span style={{ fontSize: '16px' }}>{getWeatherIcon(waypointInfo.weather.weather?.[0]?.id)}</span>
                                          <span>{waypointInfo.weather.weather?.[0]?.description || 'N/A'}</span>
                                        </div>
                                        <p style={{ margin: '4px 0' }}><strong>Temperature:</strong> {waypointInfo.weather.main?.temp}°C</p>
                                        <p style={{ margin: '4px 0' }}><strong>Humidity:</strong> {waypointInfo.weather.main?.humidity}%</p>
                                        <p style={{ margin: '4px 0' }}><strong>Pressure:</strong> {waypointInfo.weather.main?.pressure} hPa</p>
                                        {waypointInfo.weather.wind && (
                                          <div style={{ marginTop: '8px', padding: '8px', background: '#fff', borderRadius: '4px' }}>
                                            <p style={{ margin: '4px 0', fontWeight: 'bold' }}>💨 Wind Information</p>
                                            <p style={{ margin: '4px 0' }}>
                                              <strong>Direction:</strong> {getWindArrow(waypointInfo.weather.wind.deg)} {getDirectionName(waypointInfo.weather.wind.deg)} ({waypointInfo.weather.wind.deg}°)
                                            </p>
                                            <p style={{ margin: '4px 0' }}>
                                              <strong>Speed:</strong> {waypointInfo.weather.wind.speed} m/s
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Ocean Section */}
                                  <div style={{ padding: '10px', background: '#e8f5e8', borderRadius: '6px' }}>
                                    <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32', fontSize: '14px' }}>🌊 Ocean Conditions</h5>
                                    {waypointInfo.ocean && (
                                      <div style={{ fontSize: '12px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                          <div>
                                            <p style={{ margin: '4px 0' }}><strong>Wave Height:</strong> {waypointInfo.ocean.waveHeight}m</p>
                                            <p style={{ margin: '4px 0' }}><strong>Swell Height:</strong> {waypointInfo.ocean.swellHeight}m</p>
                                            <p style={{ margin: '4px 0' }}><strong>Water Temp:</strong> {waypointInfo.ocean.waterTemp}°C</p>
                                          </div>
                                          <div>
                                            <p style={{ margin: '4px 0' }}><strong>Current Speed:</strong> {waypointInfo.ocean.currentSpeed} knots</p>
                                            <p style={{ margin: '4px 0' }}><strong>Visibility:</strong> {waypointInfo.ocean.visibility} km</p>
                                          </div>
                                        </div>
                                        
                                        {/* Direction Indicators */}
                                        <div style={{ marginTop: '8px', padding: '8px', background: '#fff', borderRadius: '4px' }}>
                                          <p style={{ margin: '4px 0', fontWeight: 'bold' }}>🧭 Direction Indicators</p>
                                          <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                                            <div>
                                              <span>Swell: {getWindArrow(waypointInfo.ocean.swellDirection)} {getDirectionName(waypointInfo.ocean.swellDirection)}</span>
                                            </div>
                                            <div>
                                              <span>Current: {getWindArrow(waypointInfo.ocean.currentDirection)} {getDirectionName(waypointInfo.ocean.currentDirection)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Timestamp */}
                                  <div style={{ marginTop: '10px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
                                    Last updated: {new Date(waypointInfo.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              )}

                              {waypointInfo?.error && (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#d32f2f' }}>
                                  <div style={{ fontSize: '14px' }}>❌ {waypointInfo.error}</div>
                                  <button 
                                    onClick={() => fetchWaypointWeatherData(coord, waypointId)}
                                    style={{ 
                                      marginTop: '8px', 
                                      padding: '4px 8px', 
                                      background: '#1976d2', 
                                      color: 'white', 
                                      border: 'none', 
                                      borderRadius: '4px', 
                                      cursor: 'pointer',
                                      fontSize: '11px'
                                    }}
                                  >
                                    Retry
                                  </button>
                                </div>
                              )}

                              {!waypointInfo && !isLoading && (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Click to load weather data</div>
                                  <button 
                                    onClick={() => fetchWaypointWeatherData(coord, waypointId)}
                                    style={{ 
                                      padding: '6px 12px', 
                                      background: route.color, 
                                      color: 'white', 
                                      border: 'none', 
                                      borderRadius: '4px', 
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    Load Data
                                  </button>
                                </div>
                              )}
                            </div>
                          </Popup>
                          <Tooltip direction="top">
                            {index === 0 ? 'Start' : index === route.coordinates.length - 1 ? 'End' : `Waypoint ${index + 1}`}
                          </Tooltip>
                        </Marker>
                      );
                    })}
                  </React.Fragment>
                ) : null
              )}
            </MapContainer>
          </div>

          {/* Weather Speed Display Component */}
          <WeatherSpeedDisplay
            isSimulationRunning={isSimulationRunning}
            currentWaypointWeather={currentWaypointWeather}
            shipSpeed={shipSpeed}
            currentWeatherAffectedSpeed={currentWeatherAffectedSpeed}
          />
        </div>

        {/* Route Analytics Section */}
        <div style={{ 
          width: '100%', 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#217A8A', fontSize: '1.3rem', textAlign: 'center' }}>
            🚢 Route Analytics
          </h3>

          {/* Route Selection */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#34495e' }}>
              Select Route for Analysis:
            </label>
            <select 
              value={selectedRouteForCalculation?.id || ''} 
              onChange={(e) => {
                const route = routes.find(r => r.id === parseInt(e.target.value));
                setSelectedRouteForCalculation(route);
              }}
              style={{
                width: '300px',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                backgroundColor: '#f8f9fa'
              }}
            >
              <option value="">Choose a route...</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          {/* Route Metrics Display */}
          {selectedRouteForCalculation && (
            <div>
              <div style={{ 
                padding: '15px', 
                background: `linear-gradient(135deg, ${selectedRouteForCalculation.color}15, ${selectedRouteForCalculation.color}05)`, 
                borderRadius: '8px',
                border: `2px solid ${selectedRouteForCalculation.color}30`,
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: selectedRouteForCalculation.color, fontSize: '1.1rem', textAlign: 'center' }}>
                  {selectedRouteForCalculation.name}
                </h4>
                
                {(() => {
                  const metrics = calculateRouteMetrics(selectedRouteForCalculation);
                  if (!metrics) return <div>Loading metrics...</div>;
                  
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                      {/* Distance and Speed */}
                      <div style={{ padding: '12px', background: '#fff', borderRadius: '6px' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#217A8A', fontSize: '14px' }}>📏 Distance & Speed</h5>
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                          <div><strong>Total Distance:</strong> {metrics.totalDistance.toFixed(0)} km</div>
                          <div><strong>Base Speed:</strong> {metrics.baseSpeed} knots</div>
                          <div><strong>Adjusted Speed:</strong> {metrics.adjustedSpeed.toFixed(1)} knots</div>
                          <div><strong>Speed Factor:</strong> {(metrics.speedAdjustment * 100).toFixed(0)}%</div>
                        </div>
                      </div>

                      {/* Travel Time */}
                      <div style={{ padding: '12px', background: '#fff', borderRadius: '6px' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#28a745', fontSize: '14px' }}>⏱️ Estimated Travel Time</h5>
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                          <div><strong>Hours:</strong> {metrics.travelTimeHours.toFixed(1)} hrs</div>
                          <div><strong>Days:</strong> {metrics.travelTimeDays.toFixed(1)} days</div>
                          <div style={{ marginTop: '8px', padding: '8px', background: '#e8f5e8', borderRadius: '4px', fontSize: '12px' }}>
                            <strong>Estimated Arrival:</strong><br/>
                            {new Date(Date.now() + metrics.travelTimeHours * 60 * 60 * 1000).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Fuel Consumption */}
                      <div style={{ padding: '12px', background: '#fff', borderRadius: '6px' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#dc3545', fontSize: '14px' }}>⛽ Fuel Consumption</h5>
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                          <div><strong>Base Consumption:</strong> {metrics.baseFuelPerDay} tons/day</div>
                          <div><strong>Fuel Factor:</strong> {(metrics.fuelAdjustment * 100).toFixed(0)}%</div>
                          <div><strong>Total Fuel:</strong> {metrics.totalFuel.toFixed(1)} tons</div>
                          <div style={{ marginTop: '8px', padding: '8px', background: '#ffe6e6', borderRadius: '4px', fontSize: '12px' }}>
                            <strong>Cost Estimate:</strong><br/>
                            ${(metrics.totalFuel * 650).toFixed(0)} (at $650/ton)
                          </div>
                        </div>
                      </div>

                      {/* Weather Impact */}
                      <div style={{ padding: '12px', background: '#fff', borderRadius: '6px' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#ff9800', fontSize: '14px' }}>🌤️ Weather Impact</h5>
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                          <div><strong>Avg Wind Speed:</strong> {metrics.avgWindSpeed.toFixed(1)} m/s</div>
                          <div><strong>Avg Wave Height:</strong> {metrics.avgWaveHeight.toFixed(1)}m</div>
                          <div style={{ marginTop: '8px', padding: '8px', background: '#fff3e0', borderRadius: '4px', fontSize: '12px' }}>
                            <strong>Conditions:</strong><br/>
                            {metrics.avgWindSpeed > 15 ? '⚠️ High winds' : metrics.avgWindSpeed > 10 ? '⚠️ Moderate winds' : '✅ Favorable winds'}<br/>
                            {metrics.avgWaveHeight > 3 ? '⚠️ High waves' : metrics.avgWaveHeight > 2 ? '⚠️ Moderate waves' : '✅ Calm seas'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Recommendations */}
              <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#6c757d', fontSize: '14px' }}>💡 Recommendations</h5>
                <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#495057' }}>
                  {(() => {
                    const metrics = calculateRouteMetrics(selectedRouteForCalculation);
                    if (!metrics) return <div>Loading recommendations...</div>;
                    
                    const recommendations = [];
                    
                    if (metrics.avgWindSpeed > 15) {
                      recommendations.push('• Consider route adjustment for high winds');
                    }
                    if (metrics.avgWaveHeight > 3) {
                      recommendations.push('• Monitor wave conditions closely');
                    }
                    if (metrics.fuelAdjustment > 1.1) {
                      recommendations.push('• Fuel consumption above normal - plan accordingly');
                    }
                    if (metrics.speedAdjustment < 0.9) {
                      recommendations.push('• Speed reduced due to conditions - adjust schedule');
                    }
                    
                    if (recommendations.length === 0) {
                      recommendations.push('• Conditions favorable for optimal performance');
                    }
                    
                    return recommendations.map((rec, index) => (
                      <div key={index} style={{ marginBottom: '4px' }}>{rec}</div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!selectedRouteForCalculation && (
            <div style={{ textAlign: 'center', color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
              <div>Select a route above to view detailed analytics including:</div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#868e96' }}>
                • Estimated travel time<br/>
                • Fuel consumption<br/>
                • Weather impact analysis<br/>
                • Cost estimates<br/>
                • Route recommendations
              </div>
            </div>
          )}
        </div>

        {/* Ship Movement Simulation Section */}
        <div style={{ 
          width: '100%', 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#FF6B35', fontSize: '1.3rem', textAlign: 'center' }}>
            🚢 Ship Movement Simulation
          </h3>

          {/* Route Selection for Simulation */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#34495e' }}>
              Select Route for Simulation:
            </label>
            <select 
              value={selectedRouteForSimulation?.id || ''} 
              onChange={(e) => {
                const route = routes.find(r => r.id === parseInt(e.target.value));
                setSelectedRouteForSimulation(route);
              }}
              style={{
                width: '300px',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                backgroundColor: '#f8f9fa'
              }}
            >
              <option value="">Choose a route...</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ship Simulation Component */}
          <ShipSimulation
            selectedRoute={selectedRouteForSimulation}
            shipSpeed={shipSpeed}
            setShipSpeed={setShipSpeed}
            onSimulationUpdate={handleSimulationUpdate}
          />
        </div>
      </div>
    </>
  );
}
