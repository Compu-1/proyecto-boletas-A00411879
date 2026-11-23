import '../css/main.css';
import { connect, getEventInfo, getSeats, lockSeat, releaseSeat } from './api.js';
import { getState, setState, subscribe } from './store.js';
import { EventHeader } from './components/EventHeader.js';
import { SeatMap } from './components/SeatMap.js';
import { Cart } from './components/Cart.js';
import { ConnectionBanner } from './components/ConnectionBanner.js';
import { Toast } from './components/Toast.js';

const REFRESH_MS = 1000; // D-022: máximo 2 s para ver lo que hacen los demás
const CLOCK_MS = 250; // D-032: la cuenta regresiva no salta segundos aunque la consulta tarde

const eventHeader = EventHeader(document.getElementById('event-header'));
const seatMap = SeatMap(document.getElementById('seat-area'), { onSeatClick: handleSeatClick });
const cart = Cart(document.getElementById('cart'), { onRemove: handleRemove });
const connectionBanner = ConnectionBanner(document.getElementById('connection-banner'));
const toast = Toast(document.getElementById('toast'));

// El reloj repinta cuatro veces por segundo: el aviso de conexión solo se toca si cambió
let lastConnection = null;

function render(state) {
  eventHeader.render(state);
  seatMap.render(state);
  cart.render(state);
  if (state.connection !== lastConnection) {
    lastConnection = state.connection;
    connectionBanner.render(state);
  }
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
      // Una silla quitada deja de "estar quitada" cuando la consulta ya no la muestra mía (D-034)
      const { clientId, releasedSeats } = getState();
      const stillMine = [...releasedSeats].filter((id) =>
        seats.some((seat) => seat.id === id && seat.state === 'locked' && seat.lockedBy === clientId),
      );
      setState({ seats, releasedSeats: new Set(stillMine) });
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

function markReleased(seatId, released) {
  const releasedSeats = new Set(getState().releasedSeats);
  if (released) {
    releasedSeats.add(seatId);
  } else {
    releasedSeats.delete(seatId);
  }
  setState({ releasedSeats });
}

async function handleSeatClick(seatId) {
  markReleased(seatId, false);
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

// La silla sale del carrito al instante, aunque no se pueda confirmar la liberación (RN-06, D-034):
// si el servidor no responde, la retención vence sola a los 90 s
async function handleRemove(seatId) {
  markReleased(seatId, true);
  try {
    await releaseSeat(seatId, getState().clientId);
  } catch (error) {
    if (error.isConnectionError) {
      setState({ connection: 'offline' });
    } else {
      toast.show(error.message);
    }
  }
  if (getState().connection === 'online') {
    await refreshSeats();
  }
}

async function start() {
  subscribe(render);
  render(getState());
  setInterval(() => setState({ now: Date.now() }), CLOCK_MS);
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
