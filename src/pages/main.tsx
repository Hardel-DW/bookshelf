import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './proto/App.tsx'
import AppInCss from './style/AppInCss.tsx'

const Component = window.location.pathname === '/style' ? AppInCss : App
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Component />
  </StrictMode>,
)
