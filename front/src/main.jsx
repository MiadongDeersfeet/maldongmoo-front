import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/variables.css';
import '@/styles/tokens.css';
import '@/styles/global.css';
import '@/styles/scrollbar.css';
import App from '@/app/App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
