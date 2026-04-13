import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import posthog from 'posthog-js' // <-- 1. Add this import

// <-- 2. Add this initialization block
posthog.init('phc_xQhsiLjq6mhqTASY4WotyjQXwDcXv9ZvjEjBjgF9zSEW', {
  api_host: 'https://us.i.posthog.com',
  autocapture: true 
})

createRoot(document.getElementById('root')!).render(
  <App />
)