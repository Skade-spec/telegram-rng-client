import { TelegramWebApp, useWebAppInitDataUnsafe } from '@kloktunov/react-telegram-webapp';
import { useEffect, useState } from 'react';
import './App.css'; 

const SERVER_URL = 'https://telegram-rng-server.onrender.com';

function InnerApp() {
  const initDataUnsafe = useWebAppInitDataUnsafe();
  const user = initDataUnsafe?.user;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    window.Telegram.WebApp.expand();

    const url = `${SERVER_URL}/profile/${user.id}?username=${encodeURIComponent(user.username)}&first_name=${encodeURIComponent(user.first_name)}`;

    fetch(url)
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
    return <div className="center">Открой через Telegram Web App</div>;
  }

  return (
    <div className="container">
      <h1 className="title">RNG Игра</h1>
      {profile && (
        <div className="card">
          <p className="greeting">Привет, {user.first_name}</p>
          <p className="title-display">
            Текущий титул:{' '}
            {profile.title ? (
              <strong>
                {profile.title.label} <span className="chance">(1 к {profile.title.chance_ratio})</span>
              </strong>
            ) : (
              'Без титула'
            )}
          </p>
        </div>
      )}
      <button className="roll-button" onClick={roll} disabled={loading}>
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
