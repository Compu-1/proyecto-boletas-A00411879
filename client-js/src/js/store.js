// Estado en memoria, sin red ni DOM: los componentes se suscriben y se repintan al cambiar
const CLIENT_ID_KEY = 'clientId';

// El comprador se identifica por su pestaña: se genera una vez y sobrevive a las recargas (D-025)
function loadClientId() {
  try {
    const saved = sessionStorage.getItem(CLIENT_ID_KEY);
    if (saved) {
      return saved;
    }
  } catch (error) {
    // sessionStorage bloqueado: se usa un id solo para esta carga
  }
  const created = 'WEB-' + Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '0');
  try {
    sessionStorage.setItem(CLIENT_ID_KEY, created);
  } catch (error) {
    // sin persistencia
  }
  return created;
}

const state = {
  connection: 'connecting', // 'connecting' | 'online' | 'offline'
  event: null,
  clientId: loadClientId(),
  seats: [], // [{ id, zone, row, number, price, state, lockedBy }], vacío hasta la primera consulta
  pendingSeats: new Set(), // ids con una retención en curso
};
const listeners = new Set();

export function getState() {
  return { ...state };
}

export function setState(changes) {
  Object.assign(state, changes);
  listeners.forEach((listener) => listener(getState()));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
