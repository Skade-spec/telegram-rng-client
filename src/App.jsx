import { useState } from 'react';
import InnerApp from './InnerApp.jsx';
import WakeUpScreen from './WakeUpScreen.jsx';

function App() {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready ? <WakeUpScreen onReady={() => setReady(true)} /> : <InnerApp />}
    </>
  );
}

export default App;
