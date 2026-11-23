export const OFFLINE_MESSAGE = 'Sin conexión con la taquilla. Recarga la página para intentar de nuevo.';

// Estado de la conexión: "Conectado" si hay conexión, franja de aviso si se perdió, nada mientras conecta
export function ConnectionBanner(contenedor) {
  return {
    render({ connection }) {
      contenedor.className = 'connection-banner';
      contenedor.textContent = '';
      if (connection === 'online') {
        contenedor.classList.add('connection-banner--online');
        contenedor.textContent = 'Conectado';
      } else if (connection === 'offline') {
        contenedor.classList.add('connection-banner--offline');
        contenedor.setAttribute('role', 'alert');
        contenedor.textContent = OFFLINE_MESSAGE;
        return;
      }
      contenedor.removeAttribute('role');
    },
  };
}
