import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/cinzel/latin-500.css'
import '@fontsource/cinzel/latin-600.css'
import '@fontsource-variable/inter'
import App from './App'
import './i18n'
import './settings/theme'

// In the browser, ask to keep our data even when storage runs low (installed apps get this automatically)
if (!('__TAURI_INTERNALS__' in window)) void navigator.storage?.persist?.()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
