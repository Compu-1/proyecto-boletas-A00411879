import '../css/main.css';
import { connect, getEventInfo, getSeats, lockSeat } from './api.js';
import { getState, setState, subscribe } from './store.js';
import { EventHeader } from './components/EventHeader.js';
import { SeatMap } from './components/SeatMap.js';
import { ConnectionBanner } from './components/ConnectionBanner.js';
import { Toast } from './components/Toast.js';

const REFRESH_MS = 1000; // D-022: máximo 2 s para ver lo que hacen los demás

const eventHeader = EventHeader(document.getElementById('event-header'));
const seatMap = SeatMap(document.getElementById('seat-area'), { onSeatClick: handleSeatClick });
const connectionBanner = ConnectionBanner(document.getElementById('connection-banner'));
const toast = Toast(document.getElementById('toast'));

function render(state) {
  eventHeader.render(state);
  seatMap.render(state);
  connectionBanner.render(state);
}

// Se aplica solo la respuesta de la consulta más reciente (D-023): una respuesta atrasada
// no puede mostrar libre una silla que ya se retuvo
let lastRequest = 0;
let lastApplied = 0;

async function refreshSeats() {
  const ticket = ++lastRequest;
  try {
    const seats = await getSeats();
    if (ticket > lastApplied) {
      lastApplied = ticket;
      setState({ seats });
    }
  } catch (error) {
    console.error(error.message);
    setState({ connection: 'offline' });
  }
}

// Cada consulta se agenda al terminar la anterior; el ciclo se detiene al quedar sin conexión
async function pollSeats() {
  while (getState().connection === 'online') {
    await refreshSeats();
    await new Promise((resolve) => setTimeout(resolve, REFRESH_MS));
  }
}

function markPending(seatId, pending) {
  const pendingSeats = new Set(getState().pendingSeats);
  if (pending) {
    pendingSeats.add(seatId);
  } else {
    pendingSeats.delete(seatId);
  }
  setState({ pendingSeats });
}

async function handleSeatClick(seatId) {
  markPending(seatId, true);
  try {
    await lockSeat(seatId, getState().clientId);
  } catch (error) {
    if (error.isConnectionError) {
      setState({ connection: 'offline' });
    } else {
      toast.show(error.message);
    }
  }
  // La silla sigue marcada hasta ver su estado real, para que un doble clic no mande dos retenciones
  if (getState().connection === 'online') {
    await refreshSeats();
  }
  markPending(seatId, false);
}

async function start() {
  subscribe(render);
  render(getState());
  try {
    // Si la conexión se pierde después, se avisa pero se conserva lo que ya se veía
    await connect({ onDisconnect: () => setState({ connection: 'offline' }) });
    const event = await getEventInfo();
    setState({ connection: 'online', event });
  } catch (error) {
    console.error(error.message);
    setState({ connection: 'offline' });
    return;
  }
  pollSeats();
}

start();
