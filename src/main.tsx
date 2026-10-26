import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDemoData } from './db/demoData'
import { registerSW } from 'virtual:pwa-register'

// Ensure service worker updates immediately and claims clients
registerSW({ immediate: true })

// Initialize DB and render
initializeDemoData().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}).catch(console.error);
