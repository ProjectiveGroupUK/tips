// React
import React from 'react'
import ReactDOM from 'react-dom/client'

// Components
import App from './App'

// CSS
import '@/styles/global.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
