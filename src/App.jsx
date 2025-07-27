import { TelegramWebApp, useWebAppInitDataUnsafe } from '@kloktunov/react-telegram-webapp';
import { useEffect, useState } from 'react';

import './App.css'; 

const SERVER_URL = 'https://telegram-rng-server.onrender.com';

function InnerApp() {
  const initDataUnsafe = useWebAppInitDataUnsafe();
  const user = initDataUnsafe?.user;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rngs, setRngs] = useState([]);
  const [rollingTitle, setRollingTitle] = useState(null);

  useEffect(() => {
    if (!user) return;
    window.Telegram.WebApp.expand();

    fetch(`${SERVER_URL}/profile/${user.id}?username=${encodeURIComponent(user.username)}&first_name=${encodeURIComponent(user.first_name)}`)
      .then(r => r.json())
      .then(d => setProfile(d));

    fetch(`${SERVER_URL}/rngs`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setRngs(data);
      });
  }, [user]);

  const roll = async () => {
    if (!user || rngs.length === 0) return;

    setLoading(true);

    let i = 0;
    const interval = setInterval(() => {
      setRollingTitle(rngs[i % rngs.length]);
      i++;
    }, 80); 

    const res = await fetch(`${SERVER_URL}/roll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    const result = await res.json();

    setTimeout(() => {
      clearInterval(interval);
      setRollingTitle(null);
      setProfile(prev => ({ ...prev, title: result }));
      setLoading(false);
    }, 2000); 
  };

  if (!user) {
    return <div className="container">Открой через Telegram Web App</div>;
  }

  const displayTitle = rollingTitle || profile?.title;

  return (
    <div className="container">
      <h1 className="title">RNG Игра</h1>

      {profile && (
        <div className="card">
          <p className="greeting">Привет, {user.first_name}</p>
          <div className="title-display">
          <div className="title-label">Текущий титул</div>
            {displayTitle ? (
              <>
                <div className="title-name">{displayTitle.label}</div>
                <div className="title-chance">1 к {displayTitle.chance_ratio}</div>
              </>
            ) : (
              <div className="title-name">Без титула</div>
            )}
          </div>
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
