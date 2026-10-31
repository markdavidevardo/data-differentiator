import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '@fontsource/google-sans/latin-400.css';
import '@fontsource/google-sans/latin-500.css';
import '@fontsource/google-sans/latin-600.css';
import '@fontsource/google-sans/latin-700.css';
import './index.css';

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
