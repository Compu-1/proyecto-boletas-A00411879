import { Ice } from 'ice';
import './generated/BookingService.js';

// En el navegador los stubs generados se registran en window (no en exports), como los de ice
const { BookingApp } = window;

// Única capa que conoce Ice: el resto de la aplicación solo ve estas funciones
const WS_PORT = 10002;
const TIMEOUT_MS = 10000;
const CONNECTION_ERROR = 'Sin conexión con la taquilla.';

let communicator = null;
let proxy = null;

// Errores de negocio (Slice) conservan su reason; los de red se unifican en un mensaje
function translate(error) {
  if (error && error.reason) {
    return new Error(error.reason);
  }
  if (error instanceof Ice.LocalException) {
    return new Error(CONNECTION_ERROR);
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
