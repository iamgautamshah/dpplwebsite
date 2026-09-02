import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { installSparks } from './lib/ui.jsx';

// Animations are gated on this flag so that a browser without JavaScript never
// gets left looking at elements parked at opacity 0. It is set here, just
// before the first React render, rather than in the document head — that way
// the prerendered HTML still paints immediately and unstyled.
document.documentElement.dataset.js = '1';

// every button and link answers a click with a spark burst
installSparks();

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
