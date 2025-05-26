import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Import globalnych styli i Tailwind

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Nie znaleziono elementu #root. Aplikacja React (sklep) nie może zostać uruchomiona.");
}
