import '../css/main.css';
import { connect, getEventInfo, getSeats, lockSeat, releaseSeat, confirmBooking, getMyBookings } from './api.js';
import { getState, setState, subscribe } from './store.js';
import { myCart } from './seats.js';
import { EventHeader } from './components/EventHeader.js';
import { SeatMap } from './components/SeatMap.js';
import { Cart } from './components/Cart.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { Receipt } from './components/Receipt.js';
import { MyBookings } from './components/MyBookings.js';
import { ConnectionBanner, OFFLINE_MESSAGE } from './components/ConnectionBanner.js';
import { Toast } from './components/Toast.js';

const REFRESH_MS = 1000; // D-022: máximo 2 s para ver lo que hacen los demás
const CLOCK_MS = 250; // D-032: la cuenta regresiva no salta segundos aunque la consulta tarde

const eventHeader = EventHeader(document.getElementById('event-header'));
const seatMap = SeatMap(document.getElementById('seat-area'), { onSeatClick: handleSeatClick });
const cart = Cart(document.getElementById('cart'), { onRemove: handleRemove, onPay: handlePay });
const checkoutModal = CheckoutModal(document.getElementById('checkout'), {
  onConfirm: handleConfirm,
  onCancel: handleCancel,
});
const receipt = Receipt(document.getElementById('receipt'), { onClose: handleCloseReceipt });
const myBookings = MyBookings(document.getElementById('my-bookings'));
const connectionBanner = ConnectionBanner(document.getElementById('connection-banner'));
const toast = Toast(document.getElementById('toast'));

// El reloj repinta cuatro veces por segundo: el aviso de conexión solo se toca si cambió
let lastConnection = null;

function render(state) {
  eventHeader.render(state);
  seatMap.render(state);
  cart.render(state);
  checkoutModal.render(state);
  receipt.render(state);
  myBookings.render(state);
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

// Compras de esta sesión: solo cambian cuando este comprador paga (D-041)
async function refreshBookings() {
  try {
    setState({ bookings: await getMyBookings(getState().clientId) });
  } catch (error) {
    console.error(error.message);
    if (error.isConnectionError) {
      setState({ connection: 'offline' });
    }
  }
}

// Sillas que se van a pagar: las del carrito, sin el tiempo restante
function cartItems(state) {
  return myCart(state).map(({ id, zone, price }) => ({ id, zone, price }));
}

// El pago se hace sobre la lista congelada al abrir (D-038)
function handlePay() {
  setState({ checkout: { items: cartItems(getState()), sending: false, error: '' } });
}

// Con un pago en curso no se cierra: la respuesta decide si sale el comprobante
function handleCancel() {
  const { checkout } = getState();
  if (checkout && !checkout.sending) {
    setState({ checkout: null });
  }
}

async function handleConfirm({ name, email }) {
  const { checkout, clientId } = getState();
  if (!checkout || checkout.sending) {
    return;
  }
  // Un solo pago a la vez (D-040)
  setState({ checkout: { ...checkout, sending: true, error: '' } });
  try {
    const { code, total } = await confirmBooking(checkout.items.map(({ id }) => id), clientId, name, email);
    setState({ checkout: null, receipt: { code, items: checkout.items, total, name: name.trim(), email: email.trim() } });
    await refreshSeats();
    await refreshBookings();
  } catch (error) {
    if (error.isConnectionError) {
      // El carrito y los datos escritos no cambian (RN-08)
      setState({ connection: 'offline', checkout: { ...checkout, sending: false, error: OFFLINE_MESSAGE } });
      return;
    }
    // Rechazo de negocio: el siguiente intento paga lo que sigue en el carrito (D-038)
    await refreshSeats();
    setState({ checkout: { items: cartItems(getState()), sending: false, error: error.message } });
  }
}

function handleCloseReceipt() {
  setState({ receipt: null });
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
  refreshBookings();
  pollSeats();
}

start();
