# Maritime Ship Simulation

This is a React-based maritime ship simulation that calculates weather-affected ship speeds and movement along trade routes. The application visualizes ship routes, integrates real-time weather data, and provides fuel and cost calculations.

## Setup

### 1. OpenWeatherMap API Key

The simulation requires an OpenWeatherMap API key for weather data.

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key
4. Create a `.env` file in the `client` directory with:
   ```
   VITE_weather_api=your_actual_api_key_here
   ```
   **Important:** The variable must be prefixed with `VITE_` (not `REACT_APP_`).

### 2. Install Dependencies

```sh
cd client
npm install
```

### 3. Start the Application

```sh
npm run dev
```

The app will be available at [http://localhost:5174](http://localhost:5174) (or the port shown in your terminal).

## Features

- **Weather-Affected Speed Calculations:** Uses maritime formulas to calculate ship speed based on wind, waves, swell, and currents
- **Real-time Simulation:** Watch ships move along trade routes with realistic weather impacts
- **Multiple Routes:** Pre-configured trade routes between major ports
- **Fuel and Cost Calculations:** Estimates fuel consumption and operational costs
- **Weather Data Integration:** Real weather data from OpenWeatherMap API

## How It Works

1. **Select a Route:** Choose from available maritime trade routes
2. **Set Ship Speed:** Adjust the base speed of your vessel
3. **Start Simulation:** Watch the ship move waypoint by waypoint
4. **Monitor Weather Impact:** See how weather conditions affect ship speed and fuel consumption

## Troubleshooting

### White Screen / Not Loading

- **Check environment variable:** Ensure your `.env` file uses `VITE_weather_api` (not `REACT_APP_weather_api`)
- **Restart server:** After changing `.env`, restart the development server
- **Check console:** Open browser console (F12) for error messages

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
- **Maritime Calculations:** Based on naval architecture formulas for wind, wave, and current resistance
- **Haversine Formula:** For accurate distance calculations between waypoints
- **Real-time Weather:** OpenWeatherMap API for current weather conditions
- **React Hooks:** For state management and real-time updates

## Security Note

- Never commit your actual API key to version control
- The `.env` file should be in your `.gitignore`
- Use placeholders in documentation and examples

---

For more details, see [SETUP.md](client/SETUP.md).
