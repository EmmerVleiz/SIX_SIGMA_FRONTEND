import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './theme.css'
import App from './App.jsx'
import LoginPage from './pages/Login.jsx'
import { tokens } from './api.js'

function PrivateRoute({ children }) {
  const isAuthed = !!tokens.access
  return isAuthed ? children : <Navigate to="/login" replace />
}

const root = createRoot(document.getElementById('root'))
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<PrivateRoute><App /></PrivateRoute>} />
    </Routes>
  </BrowserRouter>
)
