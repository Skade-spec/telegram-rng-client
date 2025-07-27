import { useEffect, useState } from 'react';
import './App.css';

const SERVER_URL = 'https://telegram-rng-server.onrender.com';

function App() {
  const tg = window.Telegram.WebApp;
  const user = tg.initDataUnsafe.user;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    tg.expand();
    fetch(`${SERVER_URL}/profile/${user.id}`)
      .then(res => res.json())
      .then(data => setProfile(data));
  }, []);

  const roll = async () => {
    setLoading(true);
    const res = await fetch(`${SERVER_URL}/roll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    const result = await res.json();
    setProfile(p => ({ ...p, title: result }));
    setLoading(false);
  };

  return (
    <div className="App">
      <h1>RNG Игра</h1>
      {profile && (
        <>
          <p>Привет, {user.first_name}</p>
          <p>Текущий титул: {profile.title.label} 1 к {profile.title.chance_ratio}</p>
        </>
      )}
      <button onClick={roll} disabled={loading}>
        {loading ? 'Крутим...' : 'Крутить рулетку'}
      </button>
    </div>
  );
}

export default App;
