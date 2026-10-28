"use client";
import { useEffect } from 'react';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const STORAGE_KEY = 'sat_last_background_sync';

export default function SatBackgroundSync() {
  useEffect(() => {
    // Función que evalúa y ejecuta la sincronización periódica
    const ejecutarSyncSiCorresponde = async () => {
      try {
        // Verificar si el usuario ha iniciado sesión
        const token =
          (typeof window !== 'undefined' &&
            (sessionStorage.getItem('authToken') ||
              localStorage.getItem('authToken') ||
              localStorage.getItem('token') ||
              sessionStorage.getItem('token'))) ||
          '';

        if (!token) return;

        // Comprobar si ya transcurrieron al menos 5 minutos desde la última sincronización
        const ultimoSyncStr = localStorage.getItem(STORAGE_KEY);
        const ahora = Date.now();
        if (ultimoSyncStr) {
          const ultimoSync = parseInt(ultimoSyncStr, 10);
          if (ahora - ultimoSync < SYNC_INTERVAL_MS) {
            return;
          }
        }

        // Marcar marca de tiempo antes de la petición para evitar condiciones de carrera
        localStorage.setItem(STORAGE_KEY, ahora.toString());

        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token.replace(/^Bearer\s+/i, '').trim()}`;
        }

        const res = await fetch('/api/descarga-masiva/cron', {
          method: 'GET',
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          // Notificar a componentes en pantalla (ej. BandejaPeticionesTab) si hubo cambios
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('sat-sync-event', {
                detail: {
                  timestamp: ahora,
                  ...data,
                },
              })
            );
          }
        }
      } catch (err) {
        console.warn('[SatBackgroundSync Warning]:', err.message);
      }
    };

    // Verificar en el arranque
    ejecutarSyncSiCorresponde();

    // Temporizador recurrente cada 5 minutos
    const intervalId = setInterval(ejecutarSyncSiCorresponde, SYNC_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  return null;
}

