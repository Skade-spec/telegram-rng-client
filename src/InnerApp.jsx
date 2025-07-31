import { TelegramWebApp, useWebAppInitDataUnsafe } from '@kloktunov/react-telegram-webapp';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useSwipeable } from 'react-swipeable';
import SeasonBanner from './Components/SeasonBanner';

const SERVER_URL = 'https://telegram-rng-server.onrender.com';

export default function InnerApp() {
  const initDataUnsafe = useWebAppInitDataUnsafe();
  const user = initDataUnsafe?.user;

  const [profile, setProfile] = useState(null);
  const [regularRngs, setRegularRngs] = useState([]);
  const [seasonalRngs, setSeasonalRngs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [rollingTitle, setRollingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rewardAnim, setRewardAnim] = useState(false);
  const [hasRewarded, setHasRewarded] = useState(false);
  const [mode, setMode] = useState('regular'); 
  const [seasonInfo, setSeasonInfo] = useState(null);

  const handlers = useSwipeable({
    onSwipedLeft: () => setMode('seasonal'),
    onSwipedRight: () => setMode('regular'),
  });

  useEffect(() => {
    fetch(`${SERVER_URL}/season`)
      .then(res => res.json())
      .then(data => setSeasonInfo(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (newTitle?.chance_ratio >= 1000 && !hasRewarded) {
      setHasRewarded(true);
      setRewardAnim(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      const timeout = setTimeout(() => {
        setRewardAnim(false);
      }, 800);

      return () => clearTimeout(timeout);
    }
  }, [newTitle, hasRewarded]);

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
        if (Array.isArray(rngsData)) {
          setRegularRngs(rngsData.filter((r) => r.season === 0));
          setSeasonalRngs(rngsData.filter((r) => r.season !== 0));
        }
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
      }
    };

    loadData();
  }, [user]);

  const rollSound = new Audio('/sounds/roll.ogg');

  const roll = async () => {
    const currentRngs = mode === 'seasonal' ? seasonalRngs : regularRngs;

    if (!user || currentRngs.length === 0 || loading) return;
    if (!profile) return;

    const price = mode === 'seasonal' ? seasonInfo?.price ?? 0 : 0;
    if (profile.money < price) {
      alert('Недостаточно монет!');
      return;
    }

    setProfile((prev) => ({ ...prev, money: prev.money - price }));

    setLoading(true);
    setNewTitle(null);
    setHasRewarded(false);
    rollSound.play();

    let i = 0;
    const interval = setInterval(() => {
      setRollingTitle(currentRngs[i % currentRngs.length]);
      i++;
    }, 80);

    try {
      const endpoint = mode === 'seasonal' ? '/roll-seasonal' : '/roll';
      const res = await fetch(`${SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await res.json();

      setTimeout(() => {
        clearInterval(interval);
        setRollingTitle(null);
        setNewTitle(result.title || result.selected);
        setLoading(false);

        setProfile((prev) => ({
          ...prev,
          rolls_count: prev.rolls_count + 1,
          money: result.money ?? prev.money,
        }));
      }, 2000);
    } catch (err) {
      console.error('Ошибка при рулетке:', err);
      clearInterval(interval);
      setRollingTitle(null);
      setLoading(false);

      setProfile((prev) => ({ ...prev, money: prev.money + price }));
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

  const sellTitle = async () => {
    if (!user || !newTitle) return;

    try {
      const res = await fetch(`${SERVER_URL}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, rngId: newTitle.id }),
      });

      if (!res.ok) {
        throw new Error('Ошибка при продаже титула');
      }

      const updated = await res.json();

      setProfile((prev) => ({
        ...prev,
        money: updated.money,
      }));

      setNewTitle(null);
    } catch (err) {
      console.error('Ошибка при продаже титула:', err);
    }
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

  function formatTimeRemaining(endTime) {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Сезон завершён';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${days}д ${hours}ч ${minutes}м`;
  }

  if (!user) return <div className="container">Открой через Telegram Web App</div>;

  return (
    <div className="container">
      {user?.photo_url && (
        <img
          src={user.photo_url}
          alt="Profile"
          className="profile-avatar"
        />
      )}

      <h1 className="app-title">Skade RNG</h1>


      <div className="main-content">
        {profile && (
          <div className="card profile-card">
            <div className="profile-section title-section">
              <div className="section-header">Текущий титул</div>
              {profile.title ? (
                <>
                  <div className="title-name">{profile.title.label} {profile.title.season > 0 && (
                  `( S ${profile.title.season} )`
                )}</div>
                  <div className="title-chance">1 к {profile.title.chance_ratio}</div>
                </>
              ) : (
                <div className="title-name">Без титула</div>
              )}
            </div>

            <div className="section-header">Статистика</div>
            <div className="profile-section stats-section">
              <div className="money-display">Монеты: {profile.money ?? 0}</div>
              <div className="rolls-count">Круток: {profile.rolls_count}</div>
            </div>

            <div className="profile-section bonus-section">
              <div className="section-header">Прогресс бонусов</div>
              <div className="rolls-progress">
                <div className="rolls-track">
                  <span>Бонус x2: {(profile.rolls_count ?? 0) % 10}/10</span>
                  <span>Бонус x10: {(profile.rolls_count ?? 0) % 300}/300</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <SeasonBanner />
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 10 }}>
            <button onClick={() => setMode('regular')} className={mode === 'regular' ? 'roll-button' : 'roll-button secondary-button'}>
              Обычная рулетка
            </button>
            <button onClick={() => setMode('seasonal')} className={mode === 'seasonal' ? 'roll-button' : 'roll-button secondary-button'}>
              Сезонная рулетка
            </button>
          </div>
        </div>

        <div className="roll-zone" {...handlers}>
          {rollingTitle && (
            <div className="card rolling-card">
              <div className="rolling-label">Крутится...</div>
              <div className="rolling-title">{rollingTitle.label}</div>
              <div className="title-chance">1 к {rollingTitle.chance_ratio}</div>
            </div>
          )}

          {newTitle && (
            <div className={`card reward-card ${rewardAnim ? 'flash-effect shake-effect' : ''}`}>
              <div className="reward-title">Ты выбил:</div>
              <div className="reward-name">{newTitle.label}</div>
              <div className="title-chance">1 к {newTitle.chance_ratio}</div>

              <div className="reward-actions">
                <button onClick={keepTitle} className="roll-button">Оставить</button>
                <button onClick={sellTitle} className="roll-button secondary-button">Продать</button>
              </div>
            </div>
          )}
        </div>

        <div className="card action-card">
          <button className="roll-button" onClick={roll} disabled={loading}>
            {loading
              ? 'Крутим...'
              : mode === 'seasonal'
                ? 'Крутить за 50'
                : 'Крутить рулетку'}
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
                  border: profile?.title?.id === item.id ? '1px solid var(--tg-theme-button-color, #0088cc)' : '1px solid #ccc',
                  padding: 10,
                  borderRadius: 8,
                  cursor: 'pointer',
                  flex: '1 0 45%',
                }}
              >
                <div>{item.label} {item.season > 0 && (
                  `( S ${item.season} )`
                )}</div>
                <div style={{ fontSize: 12 }}>1 к {item.chance_ratio}</div>
                
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
