import { formatPrice } from '../format.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

// "Mis compras" bajo el talón (D-041): cada compra confirmada de esta sesión, de la más reciente
// a la más antigua. Solo se rehace cuando llega una lista nueva, no con cada tic del reloj.
export function MyBookings(contenedor) {
  let shown = null;
  contenedor.classList.add('my-bookings');

  const title = element('h2', 'my-bookings__title', 'Mis compras');
  const empty = element('p', 'my-bookings__empty', 'Aún no tienes compras');
  const list = element('ul', 'my-bookings__list');
  contenedor.append(title, empty, list);

  function entry({ code, seatIds, total, name, email }) {
    const item = element('li', 'my-bookings__item');
    const head = element('p', 'my-bookings__head');
    head.append(element('span', 'my-bookings__code', code), element('span', 'my-bookings__total', formatPrice(total)));
    item.append(
      head,
      element('p', 'my-bookings__seats', seatIds.join(', ')),
      element('p', 'my-bookings__buyer', `${name} · ${email}`),
    );
    return item;
  }

  return {
    render({ bookings }) {
      if (bookings === shown) {
        return;
      }
      shown = bookings;
      empty.hidden = bookings.length > 0;
      list.hidden = bookings.length === 0;
      list.replaceChildren(...[...bookings].sort((a, b) => b.timestamp - a.timestamp).map(entry));
    },
  };
}
