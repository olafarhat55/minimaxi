import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

/**
 * Start the MSW browser worker before mounting React.
 *
 * MSW is only active in development AND when the environment variable
 * VITE_USE_MSW is set to "true".  Switch your API layer to real axios by
 * setting USE_MOCK = false in src/services/api.ts and VITE_USE_MSW=true in
 * your .env.development file.
 *
 * onUnhandledRequest: 'bypass' lets any real requests (fonts, hot-reload, etc.)
 * pass through without console warnings.
 */
async function enableMocking(): Promise<void> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MSW === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
