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
    <div className="flex flex-col items-center justify-center h-screen text-center p-4">
      <div className="animate-spin text-4xl mb-3">🔄</div>
      <p className="text-xl font-medium">{status}</p>
    </div>
  );
}
