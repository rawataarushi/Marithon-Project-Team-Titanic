import React from 'react';
import { calculateWeatherAffectedSpeed } from '../utils/maritimeCalculations';
import { getWindArrow, getDirectionName } from '../services/weatherService';

const WeatherSpeedDisplay = ({ 
  isSimulationRunning, 
  currentWaypointWeather, 
  shipSpeed, 
  currentWeatherAffectedSpeed 
}) => {
  console.log('WeatherSpeedDisplay props:', {
    isSimulationRunning,
    currentWaypointWeather,
    shipSpeed,
    currentWeatherAffectedSpeed,
    hasWeatherData: !!(currentWaypointWeather && currentWaypointWeather.weather && currentWaypointWeather.ocean)
  });

  // Always show some debug info
  const debugInfo = (
    <div style={{ 
      padding: '10px', 
      background: '#f0f0f0', 
      borderRadius: '6px', 
      marginBottom: '15px',
      fontSize: '11px',
      fontFamily: 'monospace'
    }}>
      <strong>Debug Info:</strong><br/>
      isSimulationRunning: {String(isSimulationRunning)}<br/>
      hasCurrentWaypointWeather: {String(!!currentWaypointWeather)}<br/>
      shipSpeed: {shipSpeed}<br/>
      currentWeatherAffectedSpeed: {currentWeatherAffectedSpeed}<br/>
      {currentWaypointWeather && (
        <>
          Weather Data: {String(!!currentWaypointWeather.weather)}<br/>
          Ocean Data: {String(!!currentWaypointWeather.ocean)}<br/>
          Timestamp: {currentWaypointWeather.timestamp}<br/>
        </>
      )}
    </div>
  );

  if (!isSimulationRunning || !currentWaypointWeather) {
    console.log('WeatherSpeedDisplay: Not showing data because:', {
      isSimulationRunning,
      hasCurrentWaypointWeather: !!currentWaypointWeather
    });
    return (
      <div style={{ 
        width: '300px',
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
        height: 'fit-content'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#217A8A', fontSize: '1.1rem', textAlign: 'center' }}>
          🌊 Weather Speed Impact
        </h4>
        
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🌊</div>
          <div>Start simulation to see</div>
          <div style={{ marginTop: '5px', fontSize: '12px', color: '#868e96' }}>
            • Real-time weather impact<br/>
            • Speed over ground (SOG)<br/>
            • Power & fuel requirements<br/>
            • Environmental factors
          </div>
        </div>
      </div>
    );
  }

  console.log('WeatherSpeedDisplay: Showing weather data');
  
  // Calculate weather factors for display
  const weatherFactors = calculateWeatherAffectedSpeed(shipSpeed, currentWaypointWeather, 0);
  console.log('Calculated weather factors:', weatherFactors);
  
  return (
    <div style={{ 
      width: '300px',
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      boxSizing: 'border-box',
      height: 'fit-content'
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#217A8A', fontSize: '1.1rem', textAlign: 'center' }}>
        🌊 Weather Speed Impact
      </h4>
      
      {/* Current Speed Display */}
      <div style={{ 
        padding: '15px', 
        background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', 
        borderRadius: '8px',
        marginBottom: '15px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#1976d2', marginBottom: '5px' }}>Current Speed</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
          {currentWeatherAffectedSpeed.toFixed(1)} knots
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Base: {shipSpeed} kn | Impact: {(currentWeatherAffectedSpeed - shipSpeed).toFixed(1)} kn
        </div>
      </div>

      {/* Weather Factors Breakdown */}
      <div style={{ marginBottom: '15px' }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>Weather Factors</h5>
        
        {/* Wind Impact */}
        <div style={{ 
          padding: '10px', 
          background: '#f5f5f5', 
          borderRadius: '6px', 
          marginBottom: '8px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>💨 Wind ({getWindArrow(currentWaypointWeather.weather.wind?.deg)} {getDirectionName(currentWaypointWeather.weather.wind?.deg)})</span>
            <span>{currentWaypointWeather.weather.wind?.speed} m/s</span>
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Impact: {weatherFactors.factors.wind?.speedImpact.toFixed(2)} kn loss
          </div>
        </div>

        {/* Wave Impact */}
        <div style={{ 
          padding: '10px', 
          background: '#f5f5f5', 
          borderRadius: '6px', 
          marginBottom: '8px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>🌊 Wave Height</span>
            <span>{currentWaypointWeather.ocean.waveHeight}m</span>
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Impact: {weatherFactors.factors.waves?.speedLoss.toFixed(2)} kn loss
          </div>
        </div>

        {/* Swell Impact */}
        <div style={{ 
          padding: '10px', 
          background: '#f5f5f5', 
          borderRadius: '6px', 
          marginBottom: '8px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>🌊 Swell ({getWindArrow(currentWaypointWeather.ocean.swellDirection)} {getDirectionName(currentWaypointWeather.ocean.swellDirection)})</span>
            <span>{currentWaypointWeather.ocean.swellHeight}m</span>
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Impact: {weatherFactors.factors.swell?.speedLoss.toFixed(2)} kn loss
          </div>
        </div>

        {/* Current Impact */}
        <div style={{ 
          padding: '10px', 
          background: '#f5f5f5', 
          borderRadius: '6px', 
          marginBottom: '8px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>🌊 Current ({getWindArrow(currentWaypointWeather.ocean.currentDirection)} {getDirectionName(currentWaypointWeather.ocean.currentDirection)})</span>
            <span>{currentWaypointWeather.ocean.currentSpeed} kn</span>
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Impact: {weatherFactors.factors.current?.alongCourse.toFixed(2)} kn
          </div>
        </div>
      </div>

      {/* Power and Fuel Impact */}
      <div style={{ 
        padding: '12px', 
        background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', 
        borderRadius: '8px',
        fontSize: '12px'
      }}>
        <h6 style={{ margin: '0 0 8px 0', color: '#f57c00', fontSize: '13px' }}>⚡ Power & Fuel Impact</h6>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <span style={{ color: '#666' }}>Power Increase:</span><br/>
            <span style={{ fontWeight: 'bold', color: '#f57c00' }}>
              {weatherFactors.powerIncrease.toFixed(0)} kW
            </span>
          </div>
          <div>
            <span style={{ color: '#666' }}>Fuel Increase:</span><br/>
            <span style={{ fontWeight: 'bold', color: '#f57c00' }}>
              {weatherFactors.fuelIncrease.toFixed(0)} kg/h
            </span>
          </div>
        </div>
      </div>

      {/* Total Resistance */}
      <div style={{ 
        marginTop: '12px',
        padding: '10px', 
        background: 'linear-gradient(135deg, #ffebee, #ffcdd2)', 
        borderRadius: '6px',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#c62828', fontWeight: 'bold' }}>
          Total Resistance: {weatherFactors.totalResistance.toFixed(0)} N
        </div>
        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
          Combined environmental forces
        </div>
      </div>
    </div>
  );
};

export default WeatherSpeedDisplay;
