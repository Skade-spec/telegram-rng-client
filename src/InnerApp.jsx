import { TelegramWebApp, useWebAppInitDataUnsafe } from '@kloktunov/react-telegram-webapp';
import { useEffect, useState } from 'react';

const SERVER_URL = 'https://telegram-rng-server.onrender.com';

export default function InnerApp() {
  const initDataUnsafe = useWebAppInitDataUnsafe();
  const user = initDataUnsafe?.user;

  const [profile, setProfile] = useState(null);
  const [rngs, setRngs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [rollingTitle, setRollingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    window.Telegram.WebApp.expand();

    const loadData = async () => {
      try {
        const profileRes = await fetch(
          `${SERVER_URL}/profile/${user.id}?username=${encodeURIComponent(user.username)}&first_name=${encodeURIComponent(user.first_name)}`
        );
        const profileData = await profileRes.json();
        setProfile(profileData);
        setInventory(profileData.inventory?.map((item) => item.rngs) || []);

        const rngsRes = await fetch(`${SERVER_URL}/rngs`);
        const rngsData = await rngsRes.json();
        if (Array.isArray(rngsData)) setRngs(rngsData);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
      }
    };

    loadData();
  }, [user]);

  const rollSound = new Audio('/sounds/roll.mp3');

  const roll = async () => {
    if (!user || rngs.length === 0) return;
    setLoading(true);
    setNewTitle(null);

    rollSound.play();

    let i = 0;
    const interval = setInterval(() => {
      setRollingTitle(rngs[i % rngs.length]);
      i++;
    }, 80);

    try {
      const res = await fetch(`${SERVER_URL}/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const result = await res.json();

      setTimeout(() => {
        clearInterval(interval);
        setRollingTitle(null);
        setNewTitle(result);
        setLoading(false);

        if (result.chance_ratio >= 10) {
          const card = document.getElementById('reward-card');
          if (card) {
            card.classList.add('flash-effect', 'shake-effect');
            setTimeout(() => {
              card.classList.remove('flash-effect', 'shake-effect');
            }, 700);
          }
        }
      }, 2000);

    } catch (err) {
      console.error('Ошибка при рулетке:', err);
      clearInterval(interval);
      setRollingTitle(null);
      setLoading(false);
    }
  };

  const keepTitle = async () => {
    if (!user || !newTitle) return;

    await fetch(`${SERVER_URL}/inventory/keep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, rngId: newTitle.id }),
    });

    setInventory((prev) =>
      prev.find((item) => item.id === newTitle.id) ? prev : [...prev, newTitle]
    );

    setNewTitle(null);
  };

  const setActiveTitle = async (titleId) => {
    if (!user) return;

    await fetch(`${SERVER_URL}/set-title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, rngId: titleId }),
    });

    const selected = inventory.find((t) => t.id === titleId);
    setProfile((prev) => ({ ...prev, title: selected }));
  };

  if (!user) return <div className="container">Открой через Telegram Web App</div>;

  return (
    <div className="container">
      <h1 className="app-title">🎰 RNG Игра</h1>

      <div className="main-content">
        {profile && (
          <div className="card profile-card">
            <div className="greeting">Привет, {user.first_name}</div>
            <div className="title-display">
              <div className="title-label">Текущий титул</div>
              {profile.title ? (
                <>
                  <div className="title-name">{profile.title.label}</div>
                  <div className="title-chance">1 к {profile.title.chance_ratio}</div>
                </>
              ) : (
                <div className="title-name">Без титула</div>
              )}
            </div>
          </div>
        )}

        <div className="roll-zone">
          {rollingTitle && (
            <div className="card">
              <div className="title-label">Крутится:</div>
              <div className="title-name">{rollingTitle.label}</div>
              <div className="title-chance">1 к {rollingTitle.chance_ratio}</div>
            </div>
          )}

          {newTitle && (
            <div
              id="reward-card"
              className="card"
              style={{ transition: 'all 0.3s ease' }}
            >
              <div>Ты выбил: <b>{newTitle.label}</b> (1 к {newTitle.chance_ratio})</div>
              <div style={{ marginTop: 10 }}>
                <button onClick={keepTitle} className="roll-button" style={{ marginBottom: 10 }}>
                  Оставить
                </button>
                <button onClick={() => setNewTitle(null)} className="roll-button" style={{ backgroundColor: '#bbb' }}>
                  Удалить
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card action-card">
          <button className="roll-button" onClick={roll} disabled={loading}>
            {loading ? 'Крутим...' : 'Крутить рулетку'}
          </button>
        </div>
      </div>

      {inventory.length > 0 && (
        <div className="card">
          <div className="title-label">Инвентарь титулов</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {inventory.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveTitle(item.id)}
                style={{
                  border: profile?.title?.id === item.id ? '2px solid #0088cc' : '1px solid #ccc',
                  padding: 10,
                  borderRadius: 8,
                  cursor: 'pointer',
                  flex: '1 0 45%',
                }}
              >
                <div>{item.label}</div>
                <div style={{ fontSize: 12 }}>1 к {item.chance_ratio}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
