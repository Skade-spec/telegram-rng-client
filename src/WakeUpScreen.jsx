import { useEffect, useState } from 'react';
import './App.css';

export default function WakeUpScreen({ onReady }) {
  const [status, setStatus] = useState("Подключение к серверу...");

  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        await fetch('https://telegram-rng-server.onrender.com/ping');
        setStatus("Сервер запущен ✅");
        setTimeout(() => onReady(), 500);
      } catch (error) {
        setStatus("Ошибка подключения к серверу ❌");
      }
    };

    wakeUpServer();
  }, []);

  return (
    <div className="container center">
      <div className="spinner">🔄</div>
      <p className="status-text">{status}</p>
    </div>
  );
}
