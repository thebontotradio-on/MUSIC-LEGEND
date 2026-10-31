import React, { useEffect, useState } from 'react';
import { GameState } from '../server/types.js';
import { OverlayView } from './components/overlay/OverlayView.js';
import { HostDashboard } from './components/dashboard/HostDashboard.js';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const isOverlayMode =
    window.location.pathname.includes('/overlay') ||
    window.location.search.includes('view=overlay');

  // Initial fetch
  useEffect(() => {
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => setGameState(data))
      .catch((err) => console.error('Error fetching initial state:', err));
  }, []);

  // WebSocket real-time synchronization
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'STATE_UPDATE' && msg.payload) {
            setGameState(msg.payload);
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Attempt reconnect every 2s
        reconnectTimeout = setTimeout(connectWs, 2000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, []);

  // Action dispatcher helper
  const handleAction = async (endpoint: string, body?: any) => {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (data.state) {
        setGameState(data.state);
      }
      return data;
    } catch (err) {
      console.error(`Action ${endpoint} failed:`, err);
      throw err;
    }
  };

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#07070d] text-white">
        <div className="w-12 h-12 border-4 border-[#00F0FF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold tracking-widest text-gray-400 uppercase">
          Menghubungkan ke MUSIC LEGEND LIVE Engine...
        </p>
      </div>
    );
  }

  // If OBS Overlay Mode
  if (isOverlayMode) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black overflow-hidden">
        <OverlayView gameState={gameState} />
      </div>
    );
  }

  // Else Host Dashboard Mode
  return (
    <div>
      {!wsConnected && (
        <div className="bg-amber-600/90 text-black font-bold text-center py-1 text-xs">
          ⚠️ Koneksi WebSocket terputus. Mencoba menghubungkan kembali...
        </div>
      )}
      <HostDashboard gameState={gameState} onAction={handleAction} />
    </div>
  );
};

