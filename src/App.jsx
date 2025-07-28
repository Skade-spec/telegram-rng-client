import { useState } from 'react';
import InnerApp from './InnerApp.jsx';
import WakeUpScreen from './WakeUpScreen.jsx';
import { TelegramWebApp } from '@kloktunov/react-telegram-webapp'; 

import './App.css';

function App() {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready ? (
        <WakeUpScreen onReady={() => setReady(true)} />
      ) : (
        <TelegramWebApp>  
          <InnerApp />
        </TelegramWebApp>
      )}
    </>
  );
}

export default App;
