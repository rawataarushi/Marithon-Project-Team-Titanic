import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Add error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const root = createRoot(document.getElementById('root'));
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  console.error('Error rendering app:', error);
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; text-align: center; color: red;">
      <h1>Application Error</h1>
      <p>${error.message}</p>
      <button onclick="window.location.reload()">Reload Page</button>
    </div>
  `;
}
