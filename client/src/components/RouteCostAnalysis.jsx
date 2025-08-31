import React from 'react';

const RouteCostAnalysis = ({ 
  selectedRoute, 
  waypointData, 
  currentWaypointIndex = 0,
  shipSpeed = 20 
}) => {
  if (!selectedRoute) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: '#6c757d', 
        fontSize: '14px', 
        lineHeight: '1.6',
        padding: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>💰</div>
        <div>Select a route to view detailed cost analysis:</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#868e96' }}>
          • Route cost breakdown<br/>
          • Fuel consumption analysis<br/>
          • Weather impact assessment<br/>
          • Port and canal fees
        </div>
      </div>
    );
  }

  // Calculate fuel consumption based on weather conditions and speed
  const calculateFuelConsumption = (weatherSpeed, currentWaypointIndex, totalWaypoints, weatherData = null) => {
    const baseFuelConsumption = 1260; // kg/h at base speed (20 knots)
    const remainingWaypoints = totalWaypoints - currentWaypointIndex;
    
    // Fuel consumption increases with resistance and decreases with speed
    const speedFactor = Math.max(0.5, weatherSpeed / shipSpeed); // Speed ratio
    const resistanceFactor = 1 + (Math.abs(weatherSpeed - shipSpeed) / shipSpeed) * 0.5; // Resistance impact
    
    // Additional weather-based fuel adjustments
    let weatherFuelMultiplier = 1.0;
    if (weatherData && weatherData.weather && weatherData.ocean) {
      const windSpeed = weatherData.weather.wind?.speed || 0;
      const waveHeight = weatherData.ocean.waveHeight || 0;
      
      // High winds increase fuel consumption
      if (windSpeed > 15) weatherFuelMultiplier *= 1.2;
      else if (windSpeed > 10) weatherFuelMultiplier *= 1.1;
      
      // High waves increase fuel consumption
      if (waveHeight > 3) weatherFuelMultiplier *= 1.25;
      else if (waveHeight > 2) weatherFuelMultiplier *= 1.15;
    }
    
    // Calculate fuel consumption for current waypoint
    const currentFuelConsumption = baseFuelConsumption * resistanceFactor * weatherFuelMultiplier / speedFactor;
    
    // Estimate remaining fuel for the route
    const estimatedRemainingFuel = currentFuelConsumption * remainingWaypoints * 2; // 2 hours per waypoint
    
    return {
      current: currentFuelConsumption,
      remaining: estimatedRemainingFuel,
      total: currentFuelConsumption + estimatedRemainingFuel,
      weatherMultiplier: weatherFuelMultiplier,
      speedFactor: speedFactor,
      resistanceFactor: resistanceFactor
    };
  };

  // Calculate overall route cost at current waypoint
  const calculateRouteCost = (fuelConsumption, currentWaypointIndex, totalWaypoints, weatherData = null) => {
    const fuelPrice = 0.8; // USD per kg (marine fuel oil price)
    const operationalCost = 5000; // USD per hour (crew, maintenance, etc.)
    const portFees = 15000; // USD per port call
    const canalFees = selectedRoute?.style === 'dashed' ? 500000 : 0; // Suez Canal fees
    
    const remainingWaypoints = totalWaypoints - currentWaypointIndex;
    const remainingHours = remainingWaypoints * 2; // 2 hours per waypoint
    
    // Fuel cost
    const fuelCost = fuelConsumption.total * fuelPrice;
    
    // Operational cost
    const operationalCostTotal = operationalCost * remainingHours;
    
    // Port fees (only for major ports)
    const majorPortsRemaining = selectedRoute?.ports?.filter((port, index) => 
      index > currentWaypointIndex && port.type === 'major'
    ).length || 0;
    const portFeesTotal = majorPortsRemaining * portFees;
    
    // Canal fees (if applicable and not yet passed)
    const canalFeesTotal = canalFees;
    
    // Weather-related additional costs
    let weatherCostMultiplier = 1.0;
    if (weatherData && weatherData.weather && weatherData.ocean) {
      const windSpeed = weatherData.weather.wind?.speed || 0;
      const waveHeight = weatherData.ocean.waveHeight || 0;
      
      if (windSpeed > 15 || waveHeight > 3) {
        weatherCostMultiplier = 1.1; // 10% additional cost for severe conditions
      }
    }
    
    // Total route cost from current waypoint to destination
    const baseCost = fuelCost + operationalCostTotal + portFeesTotal + canalFeesTotal;
    const totalRouteCost = baseCost * weatherCostMultiplier;
    
    return {
      fuelCost: fuelCost,
      operationalCost: operationalCostTotal,
      portFees: portFeesTotal,
      canalFees: canalFeesTotal,
      weatherMultiplier: weatherCostMultiplier,
      baseCost: baseCost,
      total: totalRouteCost,
      breakdown: {
        fuel: fuelCost,
        operational: operationalCostTotal,
        ports: portFeesTotal,
        canal: canalFeesTotal,
        weather: baseCost * (weatherCostMultiplier - 1)
      }
    };
  };

  // Calculate weather-affected speed
  const calculateWeatherAffectedSpeed = (baseSpeed, weatherData, course) => {
    if (!weatherData || !weatherData.weather || !weatherData.ocean) {
      return { sog: baseSpeed, cog: course };
    }

    const windSpeed = weatherData.weather.wind?.speed || 0;
    const windDirection = weatherData.weather.wind?.deg || 0;
    const waveHeight = weatherData.ocean.waveHeight || 0;
    const currentSpeed = weatherData.ocean.currentSpeed || 0;
    const currentDirection = weatherData.ocean.currentDirection || 0;

    // Calculate wind impact
    const windAngle = Math.abs((windDirection - course + 360) % 360);
    let windImpact = 1.0;
    
    if (windAngle < 45 || windAngle > 315) {
      // Tailwind - increases speed
      windImpact = 1 + (windSpeed * 0.02);
    } else if (windAngle > 135 && windAngle < 225) {
      // Headwind - decreases speed
      windImpact = 1 - (windSpeed * 0.03);
    } else {
      // Crosswind - moderate impact
      windImpact = 1 - (windSpeed * 0.01);
    }

    // Calculate wave impact
    let waveImpact = 1.0;
    if (waveHeight > 3) {
      waveImpact = 0.8; // High waves reduce speed by 20%
    } else if (waveHeight > 2) {
      waveImpact = 0.9; // Moderate waves reduce speed by 10%
    }

    // Calculate current impact
    const currentAngle = Math.abs((currentDirection - course + 360) % 360);
    let currentImpact = 1.0;
    
    if (currentAngle < 45 || currentAngle > 315) {
      // Favorable current
      currentImpact = 1 + (currentSpeed * 0.1);
    } else if (currentAngle > 135 && currentAngle < 225) {
      // Adverse current
      currentImpact = 1 - (currentSpeed * 0.1);
    }

    // Calculate final speed
    const adjustedSpeed = baseSpeed * windImpact * waveImpact * currentImpact;
    
    return {
      sog: Math.max(5, Math.min(30, adjustedSpeed)), // Speed over ground, limited between 5-30 knots
      cog: course // Course over ground
    };
  };

  // Get current waypoint data
  const currentWaypointData = waypointData[`${selectedRoute.id}-waypoint-${currentWaypointIndex}`];
  
  // Calculate metrics
  const weatherSpeed = currentWaypointData ? 
    calculateWeatherAffectedSpeed(shipSpeed, currentWaypointData, 0) : 
    { sog: shipSpeed, cog: 0 };
  
  const fuelConsumption = calculateFuelConsumption(
    weatherSpeed.sog, 
    currentWaypointIndex, 
    selectedRoute.coordinates.length, 
    currentWaypointData
  );
  
  const routeCost = calculateRouteCost(
    fuelConsumption, 
    currentWaypointIndex, 
    selectedRoute.coordinates.length, 
    currentWaypointData
  );

  return (
    <div style={{ 
      width: '100%', 
      background: '#fff', 
      borderRadius: '12px', 
      padding: '20px', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#f57c00', fontSize: '1.3rem', textAlign: 'center' }}>
        💰 Route Cost & Fuel Analysis
      </h3>

      {/* Current Waypoint Status */}
      <div style={{ 
        padding: '15px', 
        background: `linear-gradient(135deg, ${selectedRoute.color}15, ${selectedRoute.color}05)`, 
        borderRadius: '8px',
        border: `2px solid ${selectedRoute.color}30`,
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: selectedRoute.color, fontSize: '1.1rem', textAlign: 'center' }}>
          {selectedRoute.name} - Waypoint {currentWaypointIndex + 1}
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {/* Speed Analysis */}
          <div style={{ padding: '12px', background: '#fff', borderRadius: '6px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#1976d2', fontSize: '14px' }}>⚡ Speed Analysis</h5>
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div><strong>Base Speed:</strong> {shipSpeed} knots</div>
              <div><strong>Weather Speed:</strong> {weatherSpeed.sog.toFixed(1)} knots</div>
              <div><strong>Speed Factor:</strong> {(weatherSpeed.sog / shipSpeed * 100).toFixed(0)}%</div>
              <div><strong>Impact:</strong> {weatherSpeed.sog > shipSpeed ? '+' : ''}{(weatherSpeed.sog - shipSpeed).toFixed(1)} knots</div>
            </div>
          </div>

          {/* Fuel Analysis */}
          <div style={{ padding: '12px', background: '#fff', borderRadius: '6px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#dc3545', fontSize: '14px' }}>⛽ Fuel Analysis</h5>
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div><strong>Current:</strong> {fuelConsumption.current.toFixed(0)} kg/h</div>
              <div><strong>Remaining:</strong> {fuelConsumption.remaining.toFixed(0)} kg</div>
              <div><strong>Total:</strong> {fuelConsumption.total.toFixed(0)} kg</div>
              <div><strong>Weather:</strong> {fuelConsumption.weatherMultiplier > 1 ? `+${((fuelConsumption.weatherMultiplier - 1) * 100).toFixed(0)}%` : 'Normal'}</div>
            </div>
          </div>

          {/* Cost Analysis */}
          <div style={{ padding: '12px', background: '#fff', borderRadius: '6px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#28a745', fontSize: '14px' }}>💰 Cost Analysis</h5>
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div><strong>Total Cost:</strong> ${routeCost.total.toFixed(0)}</div>
              <div><strong>Fuel Cost:</strong> ${routeCost.fuelCost.toFixed(0)}</div>
              <div><strong>Operational:</strong> ${routeCost.operationalCost.toFixed(0)}</div>
              <div><strong>Weather:</strong> {routeCost.weatherMultiplier > 1 ? `+${((routeCost.weatherMultiplier - 1) * 100).toFixed(0)}%` : 'Normal'}</div>
            </div>
          </div>

          {/* Weather Impact */}
          <div style={{ padding: '12px', background: '#fff', borderRadius: '6px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#ff9800', fontSize: '14px' }}>🌤️ Weather Impact</h5>
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              {currentWaypointData && currentWaypointData.weather ? (
                <>
                  <div><strong>Wind:</strong> {currentWaypointData.weather.wind?.speed || 0} m/s</div>
                  <div><strong>Waves:</strong> {currentWaypointData.ocean?.waveHeight || 0}m</div>
                  <div><strong>Current:</strong> {currentWaypointData.ocean?.currentSpeed || 0} knots</div>
                  <div><strong>Impact:</strong> {fuelConsumption.weatherMultiplier > 1 ? 'High' : 'Low'}</div>
                </>
              ) : (
                <div style={{ color: '#666', fontStyle: 'italic' }}>No weather data available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Cost Breakdown */}
      <div style={{ 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '8px', 
        border: '1px solid #e9ecef',
        marginBottom: '20px'
      }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '16px', textAlign: 'center' }}>
          💵 Detailed Cost Breakdown (from waypoint {currentWaypointIndex + 1})
        </h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {/* Fuel Costs */}
          <div style={{ padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <h6 style={{ margin: '0 0 8px 0', color: '#dc3545', fontSize: '13px' }}>⛽ Fuel Costs</h6>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Current Consumption:</span>
                <span>{fuelConsumption.current.toFixed(0)} kg/h</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Fuel Needed:</span>
                <span>{fuelConsumption.total.toFixed(0)} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fuel Price:</span>
                <span>$0.80/kg</span>
              </div>
              <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #e9ecef' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Total Fuel Cost:</span>
                <span>${routeCost.fuelCost.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Operational Costs */}
          <div style={{ padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <h6 style={{ margin: '0 0 8px 0', color: '#28a745', fontSize: '13px' }}>👥 Operational Costs</h6>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Remaining Hours:</span>
                <span>{((selectedRoute.coordinates.length - currentWaypointIndex) * 2).toFixed(0)} hrs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Hourly Rate:</span>
                <span>$5,000/hr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Crew & Maintenance:</span>
                <span>Included</span>
              </div>
              <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #e9ecef' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Total Operational:</span>
                <span>${routeCost.operationalCost.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Additional Fees */}
          <div style={{ padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <h6 style={{ margin: '0 0 8px 0', color: '#6f42c1', fontSize: '13px' }}>🏛️ Additional Fees</h6>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              {routeCost.portFees > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Port Fees:</span>
                  <span>${routeCost.portFees.toFixed(0)}</span>
                </div>
              )}
              {routeCost.canalFees > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Canal Fees:</span>
                  <span>${routeCost.canalFees.toFixed(0)}</span>
                </div>
              )}
              {routeCost.breakdown.weather > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d32f2f' }}>
                  <span>Weather Impact:</span>
                  <span>+${routeCost.breakdown.weather.toFixed(0)}</span>
                </div>
              )}
              <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #e9ecef' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Total Additional:</span>
                <span>${(routeCost.portFees + routeCost.canalFees + routeCost.breakdown.weather).toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ padding: '12px', background: '#e8f5e8', borderRadius: '6px', border: '1px solid #4caf50' }}>
            <h6 style={{ margin: '0 0 8px 0', color: '#2e7d32', fontSize: '13px' }}>📊 Cost Summary</h6>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Base Cost:</span>
                <span>${routeCost.baseCost.toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Weather Multiplier:</span>
                <span>{routeCost.weatherMultiplier.toFixed(2)}x</span>
              </div>
              <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #4caf50' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                <span>Total Route Cost:</span>
                <span>${routeCost.total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px', border: '1px solid #ff9800' }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#f57c00', fontSize: '14px' }}>💡 Recommendations</h5>
        <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#e65100' }}>
          {(() => {
            const recommendations = [];
            
            if (fuelConsumption.weatherMultiplier > 1.1) {
              recommendations.push('• Consider route adjustment due to high weather impact on fuel consumption');
            }
            if (routeCost.weatherMultiplier > 1.05) {
              recommendations.push('• Weather conditions are increasing operational costs significantly');
            }
            if (weatherSpeed.sog < shipSpeed * 0.9) {
              recommendations.push('• Speed reduced due to weather - consider schedule adjustment');
            }
            if (routeCost.canalFees > 0) {
              recommendations.push('• Suez Canal fees are a major cost factor - ensure efficient transit');
            }
            
            if (recommendations.length === 0) {
              recommendations.push('• Conditions are favorable for optimal performance and cost efficiency');
            }
            
            return recommendations.map((rec, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>{rec}</div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

export default RouteCostAnalysis;
