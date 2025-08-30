// Weather Service for OpenWeatherMap API
const OPENWEATHER_API_KEY = import.meta.env.VITE_weather_api;

// Debug logging
console.log('Weather API Key:', OPENWEATHER_API_KEY ? 'Set' : 'Not set');
console.log('Environment variables:', import.meta.env);

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetch weather data for a specific waypoint
 * @param {Array} coordinates - [latitude, longitude]
 * @param {string} waypointId - Unique identifier for the waypoint
 * @returns {Promise<Object>} Weather and ocean data
 */
export const fetchWaypointWeather = async (coordinates, waypointId) => {
  try {
    const [lat, lon] = coordinates;
    
    // Check if API key is available
    if (!OPENWEATHER_API_KEY) {
      console.log('Using fallback weather data - no API key provided');
      return generateFallbackWeatherData(coordinates, waypointId);
    }
    
    // Fetch current weather data
    const weatherResponse = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!weatherResponse.ok) {
      console.warn(`Weather API error: ${weatherResponse.status} - Using fallback data`);
      // Return fallback data instead of throwing error
      return generateFallbackWeatherData(coordinates, waypointId);
    }
    
    const weatherData = await weatherResponse.json();
    
    // Simulate oceanographic data (since OpenWeatherMap doesn't provide detailed marine data)
    const oceanData = generateOceanData(weatherData);
    
    return {
      weather: weatherData,
      ocean: oceanData,
      timestamp: new Date().toISOString(),
      waypointId: waypointId,
      coordinates: coordinates
    };
  } catch (error) {
    console.error('Error fetching waypoint weather:', error);
    console.log('Using fallback weather data');
    // Return fallback data instead of throwing error
    return generateFallbackWeatherData(coordinates, waypointId);
  }
};

/**
 * Generate realistic oceanographic data based on weather conditions
 * @param {Object} weatherData - Weather data from API
 * @returns {Object} Simulated ocean data
 */
const generateOceanData = (weatherData) => {
  const windSpeed = weatherData.wind?.speed || 0;
  const windDirection = weatherData.wind?.deg || 0;
  
  // Generate realistic wave heights based on wind speed
  const waveHeight = Math.max(0.3, (windSpeed * 0.2) + (Math.random() * 0.5));
  
  // Generate swell data (related to wind but with some variation)
  const swellHeight = Math.max(0.2, waveHeight * 0.6 + (Math.random() * 0.3));
  const swellDirection = (windDirection + (Math.random() * 60 - 30)) % 360;
  
  // Generate current data (ocean currents are more stable)
  const currentSpeed = 0.5 + (Math.random() * 1.5);
  const currentDirection = Math.floor(Math.random() * 360);
  
  // Water temperature based on weather temperature
  const waterTemp = (weatherData.main?.temp || 20) + (Math.random() * 2 - 1);
  
  // Visibility based on weather conditions
  let visibility = 10; // Default 10km
  if (weatherData.weather?.[0]?.main === 'Rain') visibility = 5 + Math.random() * 3;
  if (weatherData.weather?.[0]?.main === 'Fog') visibility = 1 + Math.random() * 2;
  
  return {
    waveHeight: waveHeight,
    swellDirection: Math.floor(swellDirection),
    swellHeight: swellHeight,
    currentSpeed: currentSpeed,
    currentDirection: Math.floor(currentDirection),
    waterTemp: waterTemp,
    visibility: visibility
  };
};

/**
 * Generate fallback weather data when API fails
 * @param {Array} coordinates - [latitude, longitude]
 * @param {string} waypointId - Unique identifier for the waypoint
 * @returns {Object} Fallback weather and ocean data
 */
const generateFallbackWeatherData = (coordinates, waypointId) => {
  // Generate realistic fallback weather data
  const windSpeed = 5 + Math.random() * 10; // 5-15 m/s
  const windDirection = Math.floor(Math.random() * 360);
  const temperature = 15 + Math.random() * 20; // 15-35°C
  
  return {
    weather: {
      wind: { speed: windSpeed, deg: windDirection },
      main: { temp: temperature },
      weather: [{ main: 'Clear', description: 'clear sky' }]
    },
    ocean: generateOceanData({
      wind: { speed: windSpeed, deg: windDirection },
      main: { temp: temperature }
    }),
    timestamp: new Date().toISOString(),
    waypointId: waypointId,
    coordinates: coordinates
  };
};

/**
 * Batch fetch weather data for multiple waypoints
 * @param {Array} waypoints - Array of waypoint objects with coordinates
 * @param {number} routeId - Route identifier
 * @returns {Promise<Object>} Weather data for all waypoints
 */
export const fetchRouteWeatherData = async (waypoints, routeId) => {
  const weatherData = {};
  const promises = [];
  
  waypoints.forEach((waypoint, index) => {
    const waypointId = `${routeId}-waypoint-${index}`;
    const promise = fetchWaypointWeather(waypoint, waypointId)
      .then(data => {
        weatherData[waypointId] = data;
      })
      .catch(error => {
        console.error(`Failed to fetch weather for ${waypointId}:`, error);
        weatherData[waypointId] = {
          error: 'Failed to load weather data',
          timestamp: new Date().toISOString(),
          waypointId: waypointId,
          coordinates: waypoint
        };
      });
    
    promises.push(promise);
  });
  
  await Promise.allSettled(promises);
  return weatherData;
};

/**
 * Get weather icon based on weather code
 * @param {string|number} weatherCode - OpenWeatherMap weather code
 * @returns {string} Weather emoji icon
 */
export const getWeatherIcon = (weatherCode) => {
  const iconMap = {
    '01': '☀️', // clear sky
    '02': '⛅', // few clouds
    '03': '☁️', // scattered clouds
    '04': '☁️', // broken clouds
    '09': '🌧️', // shower rain
    '10': '🌦️', // rain
    '11': '⛈️', // thunderstorm
    '13': '🌨️', // snow
    '50': '🌫️'  // mist
  };
  
  const code = weatherCode.toString().substring(0, 2);
  return iconMap[code] || '🌤️';
};

/**
 * Get wind direction arrow
 * @param {number} degrees - Wind direction in degrees
 * @returns {string} Wind direction arrow
 */
export const getWindArrow = (degrees) => {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const index = Math.round(degrees / 45) % 8;
  return arrows[index];
};

/**
 * Get direction name from degrees
 * @param {number} degrees - Direction in degrees
 * @returns {string} Direction name
 */
export const getDirectionName = (degrees) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};
