const VISIBLE_MS = 4000;

// Aviso temporal abajo a la izquierda: un mensaje nuevo reemplaza al anterior y se oculta a los 4 s
export function Toast(contenedor) {
  let timer = null;
  contenedor.className = 'toast';
  contenedor.hidden = true;

  return {
    show(message) {
      clearTimeout(timer);
      contenedor.textContent = message;
      contenedor.setAttribute('role', 'alert');
      contenedor.hidden = false;
      timer = setTimeout(() => {
        contenedor.hidden = true;
        contenedor.textContent = '';
      }, VISIBLE_MS);
    },
  };
}
