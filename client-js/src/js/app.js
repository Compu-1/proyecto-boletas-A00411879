import '../css/main.css';
import { connect, getEventInfo } from './api.js';

// Prueba mínima de conexión (T3); T6 la reemplaza por el flujo real
async function start() {
  try {
    await connect({ onDisconnect: () => console.log('[ice] conexión cerrada') });
    console.log('[ice] evento:', JSON.stringify(await getEventInfo()));
  } catch (error) {
    console.error('[ice] error:', error.message);
  }
}

start();
