# Quick Setup Guide

## Fix the White Screen Issue

### Step 1: Create the correct .env file

Create a file named `.env` in the `client` directory with this content:

```
VITE_weather_api=your_actual_api_key_here
```

**Replace `your_actual_api_key_here` with your real OpenWeatherMap API key**

### Step 2: Restart the development server

1. Stop the current server (Ctrl+C)
2. Run: `npm run dev`

### Step 3: Check if it works

The application should now load properly at `localhost:5174`

## What was wrong?

- You were using `REACT_APP_weather_api` in your .env file
- But this project uses Vite, which requires `VITE_weather_api`
- This caused the environment variable to be undefined
- Which caused a JavaScript error and white screen

## Security Note

- Never commit your actual API key to version control
- The `.env` file should be in your `.gitignore`
- Use placeholders in documentation and examples

## If it still doesn't work:

1. Check the browser console (F12) for error messages
2. Make sure the .env file is in the `client` directory
3. Make sure there are no spaces around the = sign
4. Make sure you restarted the development server
5. Make sure you replaced the placeholder with your actual API key
