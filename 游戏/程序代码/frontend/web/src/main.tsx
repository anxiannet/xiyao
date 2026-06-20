import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './ui/App';
import MapEditor from './ui/MapEditor';

const showMapEditor = window.location.pathname.includes('map-editor') || window.location.search.includes('editor=map');

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {showMapEditor ? <MapEditor /> : <App />}
  </React.StrictMode>,
);
