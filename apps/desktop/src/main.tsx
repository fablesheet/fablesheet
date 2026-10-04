import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/cinzel/latin-500.css'
import '@fontsource/cinzel/latin-600.css'
import '@fontsource-variable/inter'
import App from './App'
import './i18n'
import './settings/theme'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
