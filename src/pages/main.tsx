import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './proto/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
