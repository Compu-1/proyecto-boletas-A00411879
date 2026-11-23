import { Ice } from 'ice';
import './generated/BookingService.js';

// En el navegador los stubs generados se registran en window (no en exports), como los de ice
const { BookingApp } = window;

// Única capa que conoce Ice: el resto de la aplicación solo ve estas funciones
const WS_PORT = 10002;
const TIMEOUT_MS = 10000;
const CONNECTION_ERROR = 'Sin conexión con la taquilla.';

// Los enums de Slice llegan como objetos; la aplicación solo ve estos textos
const ZONES = { ZONEVIP: 'vip', ZONEPLATEA: 'platea', ZONEGENERAL: 'general' };
const STATES = { AVAILABLE: 'available', LOCKED: 'locked', BOOKED: 'booked' };

let communicator = null;
let proxy = null;

// Errores de negocio (Slice) conservan su reason; los de red se unifican en un mensaje
function translate(error) {
  if (error && error.reason) {
    return new Error(error.reason);
  }
  if (error instanceof Ice.LocalException) {
    // La marca permite a app.js distinguir un fallo de red de un rechazo de negocio
    return Object.assign(new Error(CONNECTION_ERROR), { isConnectionError: true });
  }
  return error;
}

export async function connect({ onDisconnect }) {
  const initData = new Ice.InitializationData();
  initData.properties = Ice.createProperties();
  initData.properties.setProperty('Ice.Override.ConnectTimeout', String(TIMEOUT_MS));
  // ACM: por defecto Ice cierra la conexión ociosa a los 60 s y la taquilla mostraría "Sin conexión"
  // con el servidor vivo. Sin cierre por inactividad y con latidos cada 30 s (Always = 3).
  initData.properties.setProperty('Ice.ACM.Client.Close', '0');
  initData.properties.setProperty('Ice.ACM.Client.Heartbeat', '3');
  communicator = Ice.initialize(initData);

  const base = communicator
    .stringToProxy(`BookingService:ws -h ${window.location.hostname} -p ${WS_PORT}`)
    .ice_invocationTimeout(TIMEOUT_MS);

  try {
    proxy = await BookingApp.BookingServicePrx.checkedCast(base);
    const connection = await proxy.ice_getConnection();
    connection.setCloseCallback(() => onDisconnect());
  } catch (error) {
    await communicator.destroy();
    communicator = null;
    throw translate(error);
  }
}

export async function getEventInfo() {
  try {
    const { name, date, venue, vipPrice, plateaPrice, generalPrice } = await proxy.getEventInfo();
    return { name, date, venue, prices: { vip: vipPrice, platea: plateaPrice, general: generalPrice } };
  } catch (error) {
    throw translate(error);
  }
}

export async function getSeats() {
  try {
    const seats = await proxy.getAllSeats();
    return seats.map(({ id, zone, row, number, price, state, lockedByClientId, lockTimestamp, lockDurationSeconds }) => ({
      id,
      zone: ZONES[zone.name],
      row,
      number,
      price,
      state: STATES[state.name],
      lockedBy: lockedByClientId,
      // Los long de Ice llegan como Ice.Long; el vencimiento (ms epoch) es 0 si la silla no está retenida (D-031)
      expiresAt: state === BookingApp.SeatState.LOCKED ? lockTimestamp.toNumber() + lockDurationSeconds.toNumber() * 1000 : 0,
    }));
  } catch (error) {
    throw translate(error);
  }
}

// Retiene la silla para el comprador; si no se puede, lanza Error con el reason del servidor
export async function lockSeat(seatId, clientId) {
  try {
    await proxy.lockSeat(seatId, clientId);
  } catch (error) {
    throw translate(error);
  }
}

// Libera una silla retenida por el comprador; si ya venció o la tomó otro, el servidor no hace nada
export async function releaseSeat(seatId, clientId) {
  try {
    await proxy.releaseSeat(seatId, clientId);
  } catch (error) {
    throw translate(error);
  }
}

// Paga las sillas retenidas; si el servidor rechaza el pago, lanza Error con su reason (D-037)
export async function confirmBooking(seatIds, clientId, name, email) {
  try {
    const { bookingCode, totalAmount, timestamp } = await proxy.confirmBooking(seatIds, clientId, name, email);
    return { code: bookingCode, total: totalAmount, timestamp: timestamp.toNumber() };
  } catch (error) {
    throw translate(error);
  }
}

// Compras confirmadas de este comprador, en el orden en que se hicieron
export async function getMyBookings(clientId) {
  try {
    const bookings = await proxy.getMyBookings(clientId);
    return bookings.map(({ bookingCode, seatIds, totalAmount, customerName, customerEmail, timestamp }) => ({
      code: bookingCode,
      seatIds: [...seatIds],
      total: totalAmount,
      name: customerName,
      email: customerEmail,
      timestamp: timestamp.toNumber(),
    }));
  } catch (error) {
    throw translate(error);
  }
}
