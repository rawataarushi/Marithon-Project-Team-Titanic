// Setup script for Vite environment variables
const fs = require('fs');
const path = require('path');

const envContent = `# Vite Environment Variables
# Note: In Vite, environment variables must be prefixed with VITE_
# Replace 'your_api_key_here' with your actual OpenWeatherMap API key
VITE_weather_api=your_api_key_here
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📁 Location:', envPath);
  console.log('🔑 Please replace "your_api_key_here" with your actual API key');
  console.log('🚀 Restart your development server for changes to take effect.');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
