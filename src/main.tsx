import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

import { PsychedelicSpiral } from './components/ui/shadcn-io/psychedelic-spiral';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
     {/* <PsychedelicSpiral/> */}
      <App />
      <PsychedelicSpiral/>
  </StrictMode>,
);
