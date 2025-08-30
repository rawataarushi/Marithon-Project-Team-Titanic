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

  if (!isSimulationRunning || !currentWaypointWeather) {
    console.log('WeatherSpeedDisplay: Not showing data because:', {
      isSimulationRunning,
      hasCurrentWaypointWeather: !!currentWaypointWeather
    });
    return (
      <div style={{ 
        width: '320px',
        background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        boxSizing: 'border-box',
        height: 'fit-content',
        border: '1px solid rgba(33, 122, 138, 0.1)'
      }}>
        <div style={{ 
          textAlign: 'center', 
          color: '#217A8A', 
          fontSize: '16px', 
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          <div style={{ 
            fontSize: '64px', 
            marginBottom: '16px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>🌊</div>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            color: '#217A8A', 
            fontSize: '1.2rem', 
            fontWeight: '600'
          }}>
            Weather Speed Impact
          </h4>
          <div style={{ color: '#666', fontSize: '14px' }}>
            Start simulation to see real-time weather effects
          </div>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(25, 118, 210, 0.1)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px',
            fontSize: '12px',
            color: '#1976d2'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>💨</div>
              <div>Wind Impact</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🌊</div>
              <div>Wave Effects</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚡</div>
              <div>Power Usage</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>⛽</div>
              <div>Fuel Consumption</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('WeatherSpeedDisplay: Showing weather data');
  
  // Calculate weather factors for display
  const weatherFactors = calculateWeatherAffectedSpeed(shipSpeed, currentWaypointWeather, 0);
  console.log('Calculated weather factors:', weatherFactors);
  
  const speedImpact = currentWeatherAffectedSpeed - shipSpeed;
  const impactColor = speedImpact >= 0 ? '#4caf50' : '#f44336';
  
  return (
    <div style={{ 
      width: '320px',
      background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
      boxSizing: 'border-box',
      height: 'fit-content',
      border: '1px solid rgba(33, 122, 138, 0.1)'
    }}>
      <h4 style={{ 
        margin: '0 0 20px 0', 
        color: '#217A8A', 
        fontSize: '1.2rem', 
        textAlign: 'center',
        fontWeight: '600'
      }}>
        🌊 Weather Speed Impact
      </h4>
      
      {/* Current Speed Display */}
      <div style={{ 
        padding: '20px', 
        background: `linear-gradient(135deg, ${speedImpact >= 0 ? '#e8f5e8' : '#ffebee'}, ${speedImpact >= 0 ? '#c8e6c9' : '#ffcdd2'})`, 
        borderRadius: '12px',
        marginBottom: '20px',
        textAlign: 'center',
        border: `1px solid ${speedImpact >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`
      }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>
          Current Speed Over Ground
        </div>
        <div style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: impactColor,
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          marginBottom: '8px'
        }}>
          {currentWeatherAffectedSpeed.toFixed(1)} knots
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '12px', 
          color: '#666',
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '8px',
          padding: '8px 12px'
        }}>
          <span>Base Speed: <strong>{shipSpeed} kn</strong></span>
          <span>Impact: <strong style={{ color: impactColor }}>{speedImpact >= 0 ? '+' : ''}{speedImpact.toFixed(1)} kn</strong></span>
        </div>
      </div>

      {/* Weather Factors Breakdown */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ 
          margin: '0 0 12px 0', 
          color: '#333', 
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>🌤️</span>
          Weather Factors
        </h5>
        
        {/* Wind Impact */}
        <div style={{ 
          padding: '12px', 
          background: 'linear-gradient(135deg, #f5f5f5, #eeeeee)', 
          borderRadius: '10px', 
          marginBottom: '10px',
          fontSize: '12px',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
            <span style={{ fontWeight: '500' }}>
              💨 Wind ({getWindArrow(currentWaypointWeather.weather.wind?.deg)} {getDirectionName(currentWaypointWeather.weather.wind?.deg)})
            </span>
            <span style={{ 
              background: '#e3f2fd', 
              padding: '4px 8px', 
              borderRadius: '6px',
              fontWeight: '600',
              color: '#1976d2'
            }}>
              {currentWaypointWeather.weather.wind?.speed} m/s
            </span>
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#666',
            background: 'rgba(25, 118, 210, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            Impact: <strong>{weatherFactors.factors.wind?.speedImpact.toFixed(2)} kn loss</strong>
          </div>
        </div>

        {/* Wave Impact */}
        <div style={{ 
          padding: '12px', 
          background: 'linear-gradient(135deg, #f5f5f5, #eeeeee)', 
          borderRadius: '10px', 
          marginBottom: '10px',
          fontSize: '12px',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
            <span style={{ fontWeight: '500' }}>🌊 Wave Height</span>
            <span style={{ 
              background: '#e8f5e8', 
              padding: '4px 8px', 
              borderRadius: '6px',
              fontWeight: '600',
              color: '#2e7d32'
            }}>
              {currentWaypointWeather.ocean.waveHeight}m
            </span>
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#666',
            background: 'rgba(46, 125, 50, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            Impact: <strong>{weatherFactors.factors.waves?.speedLoss.toFixed(2)} kn loss</strong>
          </div>
        </div>

        {/* Swell Impact */}
        <div style={{ 
          padding: '12px', 
          background: 'linear-gradient(135deg, #f5f5f5, #eeeeee)', 
          borderRadius: '10px', 
          marginBottom: '10px',
          fontSize: '12px',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
            <span style={{ fontWeight: '500' }}>
              🌊 Swell ({getWindArrow(currentWaypointWeather.ocean.swellDirection)} {getDirectionName(currentWaypointWeather.ocean.swellDirection)})
            </span>
            <span style={{ 
              background: '#fff3e0', 
              padding: '4px 8px', 
              borderRadius: '6px',
              fontWeight: '600',
              color: '#f57c00'
            }}>
              {currentWaypointWeather.ocean.swellHeight}m
            </span>
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#666',
            background: 'rgba(245, 124, 0, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            Impact: <strong>{weatherFactors.factors.swell?.speedLoss.toFixed(2)} kn loss</strong>
          </div>
        </div>

        {/* Current Impact */}
        <div style={{ 
          padding: '12px', 
          background: 'linear-gradient(135deg, #f5f5f5, #eeeeee)', 
          borderRadius: '10px', 
          marginBottom: '10px',
          fontSize: '12px',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
            <span style={{ fontWeight: '500' }}>
              🌊 Current ({getWindArrow(currentWaypointWeather.ocean.currentDirection)} {getDirectionName(currentWaypointWeather.ocean.currentDirection)})
            </span>
            <span style={{ 
              background: '#fce4ec', 
              padding: '4px 8px', 
              borderRadius: '6px',
              fontWeight: '600',
              color: '#c2185b'
            }}>
              {currentWaypointWeather.ocean.currentSpeed} kn
            </span>
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#666',
            background: 'rgba(194, 24, 91, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            Impact: <strong>{weatherFactors.factors.current?.alongCourse.toFixed(2)} kn</strong>
          </div>
        </div>
      </div>

      {/* Power and Fuel Impact */}
      <div style={{ 
        padding: '16px', 
        background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', 
        borderRadius: '12px',
        fontSize: '12px',
        border: '1px solid rgba(245, 124, 0, 0.2)',
        marginBottom: '16px'
      }}>
        <h6 style={{ 
          margin: '0 0 12px 0', 
          color: '#f57c00', 
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '16px' }}>⚡</span>
          Power & Fuel Impact
        </h6>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.7)', 
            padding: '10px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#666', marginBottom: '4px' }}>Power Increase</div>
            <div style={{ fontWeight: 'bold', color: '#f57c00', fontSize: '14px' }}>
              {weatherFactors.powerIncrease.toFixed(0)} kW
            </div>
          </div>
          <div style={{ 
            background: 'rgba(255,255,255,0.7)', 
            padding: '10px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#666', marginBottom: '4px' }}>Fuel Increase</div>
            <div style={{ fontWeight: 'bold', color: '#f57c00', fontSize: '14px' }}>
              {weatherFactors.fuelIncrease.toFixed(0)} kg/h
            </div>
          </div>
        </div>
      </div>

      {/* Total Resistance */}
      <div style={{ 
        padding: '12px', 
        background: 'linear-gradient(135deg, #ffebee, #ffcdd2)', 
        borderRadius: '10px',
        fontSize: '12px',
        textAlign: 'center',
        border: '1px solid rgba(244, 67, 54, 0.2)'
      }}>
        <div style={{ 
          color: '#c62828', 
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          Total Resistance: {weatherFactors.totalResistance.toFixed(0)} N
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          Combined environmental forces affecting ship performance
        </div>
      </div>
    </div>
  );
};

export default WeatherSpeedDisplay;
