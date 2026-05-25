import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register the service worker so the app shell can load while offline. The
// worker is intentionally inert in dev (Vite serves modules without hashes
// and HMR would clash with caching), so we only enable it in production.
if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        // Silent — the app works fine without a service worker, the cache is
        // a progressive enhancement only.
        console.warn('Service worker registration failed', error);
      });
  });
}
