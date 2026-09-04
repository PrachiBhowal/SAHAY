// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'
import { seedDevData } from './lib/devSeed'
import { getPatientData } from './lib/localStorage'
import './tokens.css'

registerSW({
  onOfflineReady() { console.log('App ready to work offline.') }
})

async function bootstrap() {
  const existing = await getPatientData()
  if (!existing) {
    await seedDevData()
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap()