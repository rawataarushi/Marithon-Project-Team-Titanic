// Maritime Speed Calculation Utilities
// Based on "Navigating the Elements: How Wind, Waves, Swell, and Currents Govern Ship Speed"

// Constants for maritime calculations
export const MARITIME_CONSTANTS = {
  // Air density at sea level (kg/m³)
  AIR_DENSITY: 1.225,
  
  // Water density (kg/m³)
  WATER_DENSITY: 1025,
  
  // Drag coefficient for typical container ship
  SHIP_DRAG_COEFFICIENT: 0.8,
  
  // Ship characteristics (typical container ship)
  SHIP_LENGTH: 400, // meters
  SHIP_BEAM: 60,    // meters
  SHIP_HEIGHT: 45,  // meters
  
  // Empirical coefficients for wave resistance
  WAVE_RESISTANCE_COEFFICIENT: 0.3, // kn loss per meter wave height
  SWELL_RESISTANCE_COEFFICIENT: 0.2, // kn loss per meter swell height
  
  // Wind resistance coefficient
  WIND_RESISTANCE_COEFFICIENT: 0.025, // kn loss per kn headwind
};

/**
 * Calculate wind resistance force on ship
 * Formula: Fw = 1/2 * ρa * Cd * A * vr²
 * @param {number} windSpeed - Wind speed in m/s
 * @param {number} windDirection - Wind direction in degrees (meteorological)
 * @param {number} shipCourse - Ship's course in degrees
 * @param {number} shipSpeed - Ship speed in knots
 * @returns {Object} Wind resistance data
 */
export const calculateWindResistance = (windSpeed, windDirection, shipCourse, shipSpeed) => {
  // Convert wind direction to relative to ship course
  const relativeWindAngle = ((windDirection + 180) % 360) - shipCourse;
  const relativeWindAngleRad = (relativeWindAngle * Math.PI) / 180;
  
  // Calculate relative wind speed component along ship's course
  const relativeWindSpeed = windSpeed * Math.cos(relativeWindAngleRad);
  
  // Calculate transverse cross-sectional area (simplified)
  const transverseArea = MARITIME_CONSTANTS.SHIP_BEAM * MARITIME_CONSTANTS.SHIP_HEIGHT;
  
  // Calculate wind resistance force
  const windForce = 0.5 * MARITIME_CONSTANTS.AIR_DENSITY * 
                   MARITIME_CONSTANTS.SHIP_DRAG_COEFFICIENT * 
                   transverseArea * 
                   Math.pow(windSpeed, 2);
  
  // Convert to speed impact (knots)
  const windSpeedImpact = relativeWindSpeed * MARITIME_CONSTANTS.WIND_RESISTANCE_COEFFICIENT;
  
  return {
    force: windForce,
    relativeAngle: relativeWindAngle,
    relativeSpeed: relativeWindSpeed,
    speedImpact: windSpeedImpact,
    isHeadwind: relativeWindSpeed > 0,
    isTailwind: relativeWindSpeed < 0
  };
};

/**
 * Calculate wave resistance impact on ship speed
 * @param {number} waveHeight - Wave height in meters
 * @param {number} waveDirection - Wave direction in degrees
 * @param {number} shipCourse - Ship's course in degrees
 * @returns {Object} Wave resistance data
 */
export const calculateWaveResistance = (waveHeight, waveDirection, shipCourse) => {
  // Calculate relative angle between waves and ship course
  const relativeWaveAngle = waveDirection - shipCourse;
  const relativeWaveAngleRad = (relativeWaveAngle * Math.PI) / 180;
  
  // Calculate wave component along ship's course
  const waveAlongCourse = waveHeight * Math.cos(relativeWaveAngleRad);
  
  // Calculate speed loss due to waves
  const speedLoss = Math.max(0, waveAlongCourse) * MARITIME_CONSTANTS.WAVE_RESISTANCE_COEFFICIENT;
  
  return {
    relativeAngle: relativeWaveAngle,
    alongCourse: waveAlongCourse,
    speedLoss: speedLoss,
    isHeadSea: waveAlongCourse > 0,
    isFollowingSea: waveAlongCourse < 0
  };
};

/**
 * Calculate swell resistance impact on ship speed
 * @param {number} swellHeight - Swell height in meters
 * @param {number} swellDirection - Swell direction in degrees
 * @param {number} shipCourse - Ship's course in degrees
 * @returns {Object} Swell resistance data
 */
export const calculateSwellResistance = (swellHeight, swellDirection, shipCourse) => {
  // Calculate relative angle between swell and ship course
  const relativeSwellAngle = swellDirection - shipCourse;
  const relativeSwellAngleRad = (relativeSwellAngle * Math.PI) / 180;
  
  // Calculate swell component along ship's course
  const swellAlongCourse = swellHeight * Math.cos(relativeSwellAngleRad);
  
  // Calculate speed loss due to swell
  const speedLoss = Math.max(0, swellAlongCourse) * MARITIME_CONSTANTS.SWELL_RESISTANCE_COEFFICIENT;
  
  return {
    relativeAngle: relativeSwellAngle,
    alongCourse: swellAlongCourse,
    speedLoss: speedLoss,
    isHeadSwell: swellAlongCourse > 0,
    isFollowingSwell: swellAlongCourse < 0
  };
};

/**
 * Calculate current effect on ship speed over ground
 * @param {number} currentSpeed - Current speed in knots
 * @param {number} currentDirection - Current direction in degrees
 * @param {number} shipCourse - Ship's course in degrees
 * @returns {Object} Current effect data
 */
export const calculateCurrentEffect = (currentSpeed, currentDirection, shipCourse) => {
  // Calculate relative angle between current and ship course
  const relativeCurrentAngle = currentDirection - shipCourse;
  const relativeCurrentAngleRad = (relativeCurrentAngle * Math.PI) / 180;
  
  // Calculate current component along ship's course
  const currentAlongCourse = currentSpeed * Math.cos(relativeCurrentAngleRad);
  
  return {
    relativeAngle: relativeCurrentAngle,
    alongCourse: currentAlongCourse,
    isFavorable: currentAlongCourse > 0,
    isAdverse: currentAlongCourse < 0
  };
};

/**
 * Calculate comprehensive weather-affected ship speed
 * @param {number} baseSpeed - Base ship speed in knots
 * @param {Object} weatherData - Weather data object
 * @param {number} shipCourse - Ship's course in degrees
 * @returns {Object} Comprehensive speed calculation results
 */
export const calculateWeatherAffectedSpeed = (baseSpeed, weatherData, shipCourse) => {
  if (!weatherData || !weatherData.weather || !weatherData.ocean) {
    return {
      sog: baseSpeed,
      stw: baseSpeed,
      powerIncrease: 0,
      fuelIncrease: 0,
      factors: {},
      totalResistance: 0
    };
  }

  // Extract weather data
  const windSpeed = weatherData.weather.wind?.speed || 0;
  const windDirection = weatherData.weather.wind?.deg || 0;
  const waveHeight = parseFloat(weatherData.ocean.waveHeight) || 0;
  const swellHeight = parseFloat(weatherData.ocean.swellHeight) || 0;
  const swellDirection = weatherData.ocean.swellDirection || 0;
  const currentSpeed = parseFloat(weatherData.ocean.currentSpeed) || 0;
  const currentDirection = weatherData.ocean.currentDirection || 0;

  // Calculate individual resistance components
  const windResistance = calculateWindResistance(windSpeed, windDirection, shipCourse, baseSpeed);
  const waveResistance = calculateWaveResistance(waveHeight, swellDirection, shipCourse);
  const swellResistance = calculateSwellResistance(swellHeight, swellDirection, shipCourse);
  const currentEffect = calculateCurrentEffect(currentSpeed, currentDirection, shipCourse);

  // Calculate total speed impact
  const totalSpeedImpact = currentEffect.alongCourse - 
                          windResistance.speedImpact - 
                          waveResistance.speedLoss - 
                          swellResistance.speedLoss;

  // Calculate Speed Over Ground (SOG) and Speed Through Water (STW)
  const sog = Math.max(0, baseSpeed + totalSpeedImpact);
  const stwRequired = Math.max(5, baseSpeed - totalSpeedImpact); // Minimum 5 knots

  // Calculate power and fuel requirements (power scales with cube of speed)
  const basePower = 7000; // kW at base speed
  const powerIncrease = basePower * Math.pow(stwRequired / baseSpeed, 3) - basePower;
  const fuelIncrease = powerIncrease * 0.18; // kg/h (SFOC = 0.18 kg/kWh)

  // Calculate total resistance force
  const totalResistance = windResistance.force + 
                         (waveResistance.speedLoss * 1000) + 
                         (swellResistance.speedLoss * 1000);

  return {
    sog: sog,
    stw: stwRequired,
    powerIncrease: Math.max(0, powerIncrease),
    fuelIncrease: Math.max(0, fuelIncrease),
    totalResistance: totalResistance,
    factors: {
      wind: windResistance,
      waves: waveResistance,
      swell: swellResistance,
      current: currentEffect,
      totalSpeedImpact: totalSpeedImpact
    }
  };
};

/**
 * Calculate estimated travel time between waypoints
 * @param {Array} waypoint1 - First waypoint coordinates [lat, lng]
 * @param {Array} waypoint2 - Second waypoint coordinates [lat, lng]
 * @param {number} speed - Speed in knots
 * @returns {Object} Travel time data
 */
export const calculateTravelTime = (waypoint1, waypoint2, speed) => {
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const lat1 = (waypoint1[0] * Math.PI) / 180;
  const lat2 = (waypoint2[0] * Math.PI) / 180;
  const dLat = ((waypoint2[0] - waypoint1[0]) * Math.PI) / 180;
  const dLng = ((waypoint2[1] - waypoint1[1]) * Math.PI) / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  // Convert speed from knots to km/h
  const speedKmh = speed * 1.852;
  
  // Calculate travel time
  const timeHours = distance / speedKmh;
  const timeMinutes = timeHours * 60;

  return {
    distance: distance,
    speedKmh: speedKmh,
    timeHours: timeHours,
    timeMinutes: timeMinutes,
    timeFormatted: `${Math.floor(timeHours)}h ${Math.round(timeMinutes % 60)}m`
  };
};
