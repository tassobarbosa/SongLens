import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ProcessingProvider } from './context/ProcessingContext.tsx';
import { PlaybackProvider } from './context/PlaybackContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary/index.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ProcessingProvider>
        <PlaybackProvider>
          <App />
        </PlaybackProvider>
      </ProcessingProvider>
    </ErrorBoundary>
  </StrictMode>,
);
