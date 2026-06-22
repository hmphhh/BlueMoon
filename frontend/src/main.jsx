import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import axios from 'axios'

// Request interceptor: attach JWT token to all requests
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor: handle expired/invalid tokens
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Auth endpoints (/api/auth/*) intentionally return 401 for bad credentials.
      // Never redirect from these — let the caller handle the error and display it.
      const isAuthRequest = error.config?.url?.includes('/api/auth/');
      if (!isAuthRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
