import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './proto/App.tsx'
import Home from './home.tsx'

function Router() {
  const path = window.location.pathname
  if (path.includes('proto')) return <App />
  return <Home />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
