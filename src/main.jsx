import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { toast } from 'react-toastify';

// PWA install prompt support
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// Register service worker for PWA
// Notifies user to refresh if a new version is available
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('Service worker registered:', reg);
        // Listen for updates to the service worker
        reg.onupdatefound = () => {
          const newWorker = reg.installing;
          newWorker.onstatechange = () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available - show toast notification
              toast.info(
                <span>
                  A new version is available. <button style={{color: '#FFD700', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600}} onClick={() => window.location.reload()}>Tap to update</button>
                </span>,
                { autoClose: false, closeOnClick: false, position: 'bottom-center', toastId: 'sw-update-toast' }
              );
            }
          };
        };
      })
      .catch(err => {
        console.error('Service worker registration failed:', err);
      });
  });
}
