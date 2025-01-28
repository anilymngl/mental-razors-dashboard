import React from 'react';
import ReactDOM from 'react-dom';
import './styles.css'; // Optional: Include your global styles
import App from './app'; // <-- Change 'App' to 'app' here

// ... existing code ...
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);