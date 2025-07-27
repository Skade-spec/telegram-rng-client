import { TelegramWebApp, useWebAppInitDataUnsafe } from '@kloktunov/react-telegram-webapp';
import { useEffect, useState } from 'react';

const SERVER_URL = 'https://telegram-rng-server.onrender.com';

function InnerApp() {
  const initDataUnsafe = useWebAppInitDataUnsafe();
  const user = initDataUnsafe?.user;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    window.Telegram.WebApp.expand();

    fetch(`${SERVER_URL}/profile/${user.id}`)
      .then(r => r.json())
      .then(d => setProfile(d));
  }, [user]);

  const roll = async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetch(`${SERVER_URL}/roll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    const result = await res.json();
    setProfile(prev => ({ ...prev, title: result }));
    setLoading(false);
  };

  if (!user) {
    return <div>Открой через Telegram Web App</div>;
  }

  return (
    <div className="App">
      <h1>RNG Игра</h1>
      {profile && <>
        <p>Привет, {user.first_name}</p>
        <p>Текущий титул: {profile?.title?.label ?? 'Без титула'}</p>
      </>}
      <button onClick={roll} disabled={loading}>
        {loading ? 'Крутим...' : 'Крутить рулетку'}
      </button>
    </div>
  );
}

function App() {
  return (
    <TelegramWebApp>
      <InnerApp />
    </TelegramWebApp>
  );
}

export default App;
