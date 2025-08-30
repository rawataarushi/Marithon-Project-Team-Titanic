import React, { useState, useEffect, useRef } from 'react';
import { calculateWeatherAffectedSpeed, calculateTravelTime } from '../utils/maritimeCalculations';
import { fetchWaypointWeather } from '../services/weatherService';
import { calculateRouteDistance } from '../data/routes';

const ShipSimulation = ({ 
  selectedRoute, 
  shipSpeed, 
  setShipSpeed,
  onSimulationUpdate 
}) => {
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [shipPosition, setShipPosition] = useState(0);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [currentWeatherAffectedSpeed, setCurrentWeatherAffectedSpeed] = useState(0);
  const [currentWaypointWeather, setCurrentWaypointWeather] = useState(null);
  const [waypointData, setWaypointData] = useState({});
  const [loadingWaypoints, setLoadingWaypoints] = useState({});
  const [simulationIntervalRef, setSimulationIntervalRef] = useState(null);
  const [totalTravelTime, setTotalTravelTime] = useState(0);
  const [currentSegmentTime, setCurrentSegmentTime] = useState(0);

  // Start simulation with weather-based speed calculations
  const startSimulation = async () => {
    if (!selectedRoute) return;
    
    console.log('Starting simulation for route:', selectedRoute.name);
    setIsSimulationRunning(true);
    setShipPosition(0);
    setSimulationProgress(0);
    setTotalTravelTime(0);
    setCurrentWeatherAffectedSpeed(0);
    
    const totalWaypoints = selectedRoute.coordinates.length;
    let currentWaypoint = 0;
    
    // Pre-fetch weather data for all waypoints
    const weatherData = await preloadWeatherData();
    console.log('Weather data loaded for simulation:', weatherData);
    
    // Process the first waypoint immediately
    await calculateWaypointSpeed(0, weatherData);
    
    // Move ship every 2 seconds (2000ms) to wait at each waypoint
    const simulationInterval = setInterval(async () => {
      if (currentWaypoint >= totalWaypoints - 1) {
        console.log('Simulation completed');
        clearInterval(simulationInterval);
        setIsSimulationRunning(false);
        setSimulationProgress(100);
        onSimulationUpdate?.({
          isRunning: false,
          position: currentWaypoint,
          progress: 100,
          weatherSpeed: currentWeatherAffectedSpeed
        });
        return;
      }
      
      currentWaypoint++;
      const progress = (currentWaypoint / (totalWaypoints - 1)) * 100;
      
      console.log(`Simulation step: waypoint ${currentWaypoint}/${totalWaypoints}, progress: ${progress.toFixed(1)}%`);
      
      // Calculate weather-affected speed at current waypoint BEFORE updating position
      await calculateWaypointSpeed(currentWaypoint, weatherData);
      
      // Calculate travel time for current segment
      if (currentWaypoint < totalWaypoints - 1) {
        const currentCoord = selectedRoute.coordinates[currentWaypoint];
        const nextCoord = selectedRoute.coordinates[currentWaypoint + 1];
        const segmentTime = calculateTravelTime(currentCoord, nextCoord, currentWeatherAffectedSpeed || shipSpeed);
        setCurrentSegmentTime(segmentTime.timeHours);
        setTotalTravelTime(prev => prev + segmentTime.timeHours);
      }
      
      // Update position and progress AFTER calculations
      setShipPosition(currentWaypoint);
      setSimulationProgress(progress);
      
    }, 2000); // Wait 2 seconds at each waypoint
    
    setSimulationIntervalRef(simulationInterval);
  };

  // Preload weather data for all waypoints
  const preloadWeatherData = async () => {
    console.log('Preloading weather data for', selectedRoute.coordinates.length, 'waypoints...');
    
    const newWaypointData = {};
    
    for (let index = 0; index < selectedRoute.coordinates.length; index++) {
      const coord = selectedRoute.coordinates[index];
      const waypointId = `${selectedRoute.id}-waypoint-${index}`;
      
      try {
        console.log(`Fetching weather for waypoint ${index + 1}/${selectedRoute.coordinates.length}`);
        const data = await fetchWaypointWeather(coord, waypointId);
        newWaypointData[waypointId] = data;
        console.log(`Weather data loaded for ${waypointId}:`, data);
      } catch (error) {
        console.error(`Failed to fetch weather for ${waypointId}:`, error);
        // Create a fallback data structure with proper number types
        newWaypointData[waypointId] = {
          weather: { 
            wind: { speed: 5, deg: 180 }, 
            main: { temp: 20 } 
          },
          ocean: { 
            waveHeight: 0.5, 
            swellHeight: 0.3, 
            swellDirection: 180, 
            currentSpeed: 1.0, 
            currentDirection: 90, 
            waterTemp: 20, 
            visibility: 10 
          },
          timestamp: new Date().toISOString(),
          waypointId: waypointId,
          coordinates: coord
        };
      }
    }
    
    console.log('All weather data loaded:', newWaypointData);
    setWaypointData(newWaypointData);
    
    // Return the data so it can be used immediately
    return newWaypointData;
  };

  // Calculate speed at specific waypoint considering weather
  const calculateWaypointSpeed = async (waypointIndex, weatherDataToUse = null) => {
    const dataToUse = weatherDataToUse || waypointData;
    const waypointId = `${selectedRoute.id}-waypoint-${waypointIndex}`;
    const waypointInfo = dataToUse[waypointId];
    
    console.log(`Calculating speed for waypoint ${waypointIndex}:`, {
      waypointId,
      waypointInfo,
      hasWeather: !!(waypointInfo && waypointInfo.weather),
      hasOcean: !!(waypointInfo && waypointInfo.ocean),
      dataSource: weatherDataToUse ? 'local' : 'state'
    });
    
    if (waypointInfo && waypointInfo.weather && waypointInfo.ocean) {
      // Calculate ship course to next waypoint
      const currentCoord = selectedRoute.coordinates[waypointIndex];
      const nextCoord = selectedRoute.coordinates[Math.min(waypointIndex + 1, selectedRoute.coordinates.length - 1)];
      const course = Math.atan2(nextCoord[1] - currentCoord[1], nextCoord[0] - currentCoord[0]) * 180 / Math.PI;
      
      console.log(`Ship course calculated: ${course}°`);
      
      // Calculate weather-affected speed using maritime formulas
      const weatherSpeed = calculateWeatherAffectedSpeed(shipSpeed, waypointInfo, course);
      console.log(`Weather-affected speed calculated:`, weatherSpeed);
      
      // Calculate fuel consumption and cost estimation
      const fuelConsumption = calculateFuelConsumption(weatherSpeed.sog, waypointIndex, selectedRoute.coordinates.length);
      const routeCost = calculateRouteCost(fuelConsumption, waypointIndex, selectedRoute.coordinates.length);
      
      console.log(`Fuel consumption: ${fuelConsumption.current.toFixed(2)} kg/h, Route cost: $${routeCost.total.toFixed(2)}`);
      
      setCurrentWeatherAffectedSpeed(weatherSpeed.sog);
      setCurrentWaypointWeather(waypointInfo);
      
      // Update parent component
      const updateData = {
        isRunning: true,
        position: waypointIndex,
        progress: (waypointIndex / (selectedRoute.coordinates.length - 1)) * 100,
        weatherSpeed: weatherSpeed.sog,
        weatherData: waypointInfo,
        course: course,
        fuelConsumption: fuelConsumption,
        routeCost: routeCost
      };
      
      console.log('Sending update to parent:', updateData);
      onSimulationUpdate?.(updateData);
    } else {
      console.warn(`Missing weather data for waypoint ${waypointIndex}:`, waypointInfo);
      console.warn('Available waypoint data keys:', Object.keys(dataToUse));
      
      // Set default values if weather data is missing
      setCurrentWeatherAffectedSpeed(shipSpeed);
      setCurrentWaypointWeather(null);
    }
  };

  // Calculate fuel consumption based on weather conditions and speed
  const calculateFuelConsumption = (weatherSpeed, currentWaypointIndex, totalWaypoints) => {
    const baseFuelConsumption = 1260; // kg/h at base speed (20 knots)
    const remainingWaypoints = totalWaypoints - currentWaypointIndex;
    
    // Fuel consumption increases with resistance and decreases with speed
    // Higher resistance = more power needed = more fuel
    const speedFactor = Math.max(0.5, weatherSpeed / shipSpeed); // Speed ratio
    const resistanceFactor = 1 + (Math.abs(weatherSpeed - shipSpeed) / shipSpeed) * 0.5; // Resistance impact
    
    // Calculate fuel consumption for current waypoint
    const currentFuelConsumption = baseFuelConsumption * resistanceFactor / speedFactor;
    
    // Estimate remaining fuel for the route
    const estimatedRemainingFuel = currentFuelConsumption * remainingWaypoints * 2; // 2 hours per waypoint
    
    return {
      current: currentFuelConsumption,
      remaining: estimatedRemainingFuel,
      total: currentFuelConsumption + estimatedRemainingFuel
    };
  };

  // Calculate overall route cost at current waypoint
  const calculateRouteCost = (fuelConsumption, currentWaypointIndex, totalWaypoints) => {
    const fuelPrice = 0.8; // USD per kg (marine fuel oil price)
    const operationalCost = 5000; // USD per hour (crew, maintenance, etc.)
    
    const remainingWaypoints = totalWaypoints - currentWaypointIndex;
    const remainingHours = remainingWaypoints * 2; // 2 hours per waypoint
    
    // Fuel cost
    const fuelCost = fuelConsumption.total * fuelPrice;
    
    // Operational cost
    const operationalCostTotal = operationalCost * remainingHours;
    
    // Total route cost from current waypoint to destination
    const totalRouteCost = fuelCost + operationalCostTotal;
    
    return {
      fuelCost: fuelCost,
      operationalCost: operationalCostTotal,
      total: totalRouteCost
    };
  };

  // Stop simulation
  const stopSimulation = () => {
    if (simulationIntervalRef) {
      clearInterval(simulationIntervalRef);
      setSimulationIntervalRef(null);
    }
    setIsSimulationRunning(false);
  };

  // Reset simulation
  const resetSimulation = () => {
    stopSimulation();
    setShipPosition(0);
    setSimulationProgress(0);
    setCurrentWeatherAffectedSpeed(0);
    setCurrentWaypointWeather(null);
    setTotalTravelTime(0);
    setCurrentSegmentTime(0);
    onSimulationUpdate?.({
      isRunning: false,
      position: 0,
      progress: 0,
      weatherSpeed: 0
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef) {
        clearInterval(simulationIntervalRef);
      }
    };
  }, [simulationIntervalRef]);

  if (!selectedRoute) {
    return (
      <div style={{ textAlign: 'center', color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🚢</div>
        <div>Select a route above to start ship movement simulation:</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#868e96' }}>
          • Choose your route<br/>
          • Adjust ship speed<br/>
          • Watch the ship move along the route<br/>
          • Monitor weather impact on speed
        </div>
      </div>
    );
  }

  const totalDistance = calculateRouteDistance(selectedRoute.coordinates);
  const remainingDistance = totalDistance * (1 - simulationProgress / 100);

  return (
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

      {/* Simulation Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', alignItems: 'end', marginBottom: '20px' }}>
        {/* Speed Control */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#34495e' }}>
            Ship Speed (knots):
          </label>
          <input
            type="range"
            min="5"
            max="30"
            value={shipSpeed}
            onChange={(e) => setShipSpeed(parseInt(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#FF6B35'
            }}
          />
          <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '14px', color: '#FF6B35', fontWeight: 'bold' }}>
            {shipSpeed} knots
          </div>
        </div>

        {/* Test Weather Button */}
        <div>
          <button
            onClick={async () => {
              console.log('Testing weather fetch...');
              try {
                const testCoord = selectedRoute.coordinates[0];
                const testData = await fetchWaypointWeather(testCoord, 'test-waypoint');
                console.log('Test weather data:', testData);
                alert('Weather test successful! Check console for details.');
              } catch (error) {
                console.error('Weather test failed:', error);
                alert('Weather test failed! Check console for details.');
              }
            }}
            style={{
              padding: '8px 16px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            🧪 Test Weather
          </button>
        </div>

        {/* Test Calculation Button */}
        <div>
          <button
            onClick={() => {
              console.log('Testing maritime calculations...');
              try {
                const testWeatherData = {
                  weather: { wind: { speed: 10, deg: 180 }, main: { temp: 20 } },
                  ocean: { waveHeight: 1.5, swellHeight: 1.0, swellDirection: 180, currentSpeed: 2.0, currentDirection: 90, waterTemp: 20, visibility: 10 }
                };
                const testCourse = 90;
                const testSpeed = calculateWeatherAffectedSpeed(shipSpeed, testWeatherData, testCourse);
                console.log('Test calculation result:', testSpeed);
                alert(`Calculation test successful!\nBase Speed: ${shipSpeed} knots\nWeather Speed: ${testSpeed.sog.toFixed(1)} knots\nCheck console for details.`);
              } catch (error) {
                console.error('Calculation test failed:', error);
                alert('Calculation test failed! Check console for details.');
              }
            }}
            style={{
              padding: '8px 16px',
              background: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            🧮 Test Calculations
          </button>
        </div>

        {/* Simulation Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={startSimulation}
            disabled={isSimulationRunning}
            style={{
              padding: '12px 20px',
              background: isSimulationRunning ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSimulationRunning ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isSimulationRunning ? '⏸️ Running...' : '▶️ Start Simulation'}
          </button>
          
          <button
            onClick={stopSimulation}
            disabled={!isSimulationRunning}
            style={{
              padding: '12px 20px',
              background: !isSimulationRunning ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: !isSimulationRunning ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ⏹️ Stop
          </button>
          
          <button
            onClick={resetSimulation}
            style={{
              padding: '12px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Simulation Status */}
      <div style={{ 
        padding: '20px', 
        background: `linear-gradient(135deg, ${selectedRoute.color}15, ${selectedRoute.color}05)`, 
        borderRadius: '8px',
        border: `2px solid ${selectedRoute.color}30`
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: selectedRoute.color, fontSize: '1.1rem', textAlign: 'center' }}>
          🚢 {selectedRoute.name} - Simulation Status
        </h4>
        
        {/* Status Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#FF6B35', marginBottom: '5px' }}>📍</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Current Position</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: selectedRoute.color }}>
              Waypoint {shipPosition + 1} of {selectedRoute.coordinates.length}
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#28a745', marginBottom: '5px' }}>📊</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Progress</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: selectedRoute.color }}>
              {simulationProgress.toFixed(1)}%
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#dc3545', marginBottom: '5px' }}>⚡</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Current Speed</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: selectedRoute.color }}>
              {currentWeatherAffectedSpeed > 0 ? currentWeatherAffectedSpeed.toFixed(1) : shipSpeed} knots
            </div>
            {currentWeatherAffectedSpeed > 0 && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Weather Impact: {(currentWeatherAffectedSpeed - shipSpeed).toFixed(1)} kn
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#ff9800', marginBottom: '5px' }}>⛽</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Fuel Consumption</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: selectedRoute.color }}>
              {currentWeatherAffectedSpeed > 0 ? 'Calculating...' : 'N/A'}
            </div>
            {currentWeatherAffectedSpeed > 0 && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Based on weather conditions
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#28a745', marginBottom: '5px' }}>💰</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Route Cost</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: selectedRoute.color }}>
              {currentWeatherAffectedSpeed > 0 ? 'Calculating...' : 'N/A'}
            </div>
            {currentWeatherAffectedSpeed > 0 && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                From current waypoint
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#ff9800', marginBottom: '5px' }}>⏱️</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Status</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: selectedRoute.color }}>
              {isSimulationRunning ? '🔄 Moving' : simulationProgress === 100 ? '✅ Completed' : '⏸️ Stopped'}
            </div>
            {isSimulationRunning && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                ⏳ Waiting 2s at waypoint
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#666' }}>
            <span>Start: {selectedRoute.ports[0]?.name}</span>
            <span>End: {selectedRoute.ports[selectedRoute.ports.length - 1]?.name}</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '20px', 
            background: '#e9ecef', 
            borderRadius: '10px', 
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{ 
              width: `${simulationProgress}%`, 
              height: '100%', 
              background: `linear-gradient(90deg, ${selectedRoute.color}, ${selectedRoute.color}dd)`,
              borderRadius: '10px',
              transition: 'width 0.3s ease',
              position: 'relative'
            }}>
              {isSimulationRunning && (
                <div style={{
                  position: 'absolute',
                  right: '0',
                  top: '0',
                  height: '100%',
                  width: '4px',
                  background: 'white',
                  animation: 'pulse 1s infinite'
                }}></div>
              )}
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          background: '#f8f9fa', 
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          <strong>Debug Info:</strong><br/>
          Waypoint Data Count: {Object.keys(waypointData).length}<br/>
          Current Waypoint: {shipPosition}<br/>
          Has Current Weather: {String(!!currentWaypointWeather)}<br/>
          Weather Data Keys: {currentWaypointWeather ? Object.keys(currentWaypointWeather) : 'None'}<br/>
          All Waypoint Keys: {Object.keys(waypointData).slice(0, 5).join(', ')}...
        </div>

        {/* Travel Time Information */}
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Total Distance:</strong> {totalDistance.toFixed(0)} km | 
            <strong> Base Speed:</strong> {shipSpeed} knots
          </div>
          {currentWeatherAffectedSpeed > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Weather Speed:</strong> {currentWeatherAffectedSpeed.toFixed(1)} knots | 
              <strong> Current Segment:</strong> {currentSegmentTime.toFixed(1)}h
            </div>
          )}
          {simulationProgress > 0 && simulationProgress < 100 && (
            <div>
              <strong>Remaining Distance:</strong> {remainingDistance.toFixed(0)} km | 
              <strong> Total Time:</strong> {totalTravelTime.toFixed(1)}h
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipSimulation;
