# Maritime Ship Simulation

This is a React-based maritime ship simulation that calculates weather-affected ship speeds and movement along trade routes.

## Setup

### 1. OpenWeatherMap API Key

The simulation requires an OpenWeatherMap API key for weather data. To get one:

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key
4. Create a `.env` file in the `client` directory with:
   ```
   VITE_weather_api=your_actual_api_key_here
   ```

**Important**: Since this project uses Vite (not Create React App), environment variables must be prefixed with `VITE_` instead of `REACT_APP_`.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Application

```bash
npm run dev
```

## Features

- **Weather-Affected Speed Calculations**: Uses maritime formulas to calculate ship speed based on wind, waves, swell, and currents
- **Real-time Simulation**: Watch ships move along trade routes with realistic weather impacts
- **Multiple Routes**: Pre-configured trade routes between major ports
- **Fuel and Cost Calculations**: Estimates fuel consumption and operational costs
- **Weather Data Integration**: Real weather data from OpenWeatherMap API

## How It Works

1. **Select a Route**: Choose from available maritime trade routes
2. **Set Ship Speed**: Adjust the base speed of your vessel
3. **Start Simulation**: Watch the ship move waypoint by waypoint
4. **Monitor Weather Impact**: See how weather conditions affect ship speed and fuel consumption

## Troubleshooting

### White Screen / Not Loading
- **Check environment variable**: Ensure your `.env` file uses `VITE_weather_api` (not `REACT_APP_weather_api`)
- **Restart server**: After changing `.env`, restart the development server
- **Check console**: Open browser console (F12) for error messages

### Ship Not Moving
- Check that you have a valid OpenWeatherMap API key
- Use the "Test Weather" and "Test Calculations" buttons to verify functionality
- Check the browser console for error messages

### Calculations Not Working
- Ensure the API key is properly set in the `.env` file
- The simulation uses fallback weather data if API calls fail
- Check that all required dependencies are installed

## Environment Variable Setup

**Correct format for Vite:**
```env
VITE_weather_api=your_api_key_here
```

**Wrong format (will not work):**
```env
REACT_APP_weather_api=your_api_key_here
```

## Technical Details

The simulation uses:
- **Maritime Calculations**: Based on naval architecture formulas for wind, wave, and current resistance
- **Haversine Formula**: For accurate distance calculations between waypoints
- **Real-time Weather**: OpenWeatherMap API for current weather conditions
- **React Hooks**: For state management and real-time updates
