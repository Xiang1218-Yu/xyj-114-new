import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider, useToast } from './components/Toast'
import { setToastCallback } from './api/client'
import './index.css'

function AppWithToast() {
  const { showToast } = useToast();
  
  useEffect(() => {
    setToastCallback(showToast);
  }, [showToast]);
  
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AppWithToast />
    </ToastProvider>
  </StrictMode>,
)
