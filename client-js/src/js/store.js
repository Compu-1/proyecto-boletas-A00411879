// Estado en memoria, sin red ni DOM: los componentes se suscriben y se repintan al cambiar
const state = {
  connection: 'connecting', // 'connecting' | 'online' | 'offline'
  event: null,
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
