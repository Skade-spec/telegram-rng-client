import { useEffect, useState } from 'react';

function formatTimeRemaining(endTime) {
  const diff = new Date(endTime) - new Date();
  if (diff <= 0) return 'Сезон завершён';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return `${days}д ${hours}ч ${minutes}м`;
}

export default function SeasonBanner() {
  const [seasonInfo, setSeasonInfo] = useState(null);

  useEffect(() => {
    fetch('https://telegram-rng-server.onrender.com/season')
      .then(res => res.json())
      .then(data => setSeasonInfo(data))
      .catch(console.error);
  }, []);

  if (!seasonInfo) return null;

  return (
    <div style={{
      background: '#222',
      borderRadius: 12,
      padding: '12px 16px',
      color: '#fff',
      marginBottom: 20,
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontSize: 18, fontWeight: 'bold' }}>
        🎯 Сезон: {seasonInfo.name}
      </div>
      {seasonInfo.ends_at && (
        <div style={{ fontSize: 14, marginTop: 6, color: '#ccc' }}>
          До конца: {formatTimeRemaining(seasonInfo.ends_at)}
        </div>
      )}
    </div>
  );
}
