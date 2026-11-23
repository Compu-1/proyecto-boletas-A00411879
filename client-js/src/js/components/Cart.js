import { formatPrice, ZONE_LABELS } from '../format.js';
import { myCart, formatTime } from '../seats.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function setText(node, text) {
  if (node.textContent !== text) {
    node.textContent = text;
  }
}

// Talón de boleta con las sillas retenidas por el comprador: silla, zona, precio, tiempo y total.
// Cada línea se crea una vez y solo se actualiza su tiempo: el reloj repinta cuatro veces por
// segundo (D-032) y reconstruir el botón "quitar" podría perder un clic.
export function Cart(contenedor, { onRemove, onPay }) {
  const lines = new Map(); // id de silla -> { item, time }
  contenedor.classList.add('cart');

  const title = element('h2', 'cart__title', 'Tu boleta');
  const empty = element('p', 'cart__empty', 'Tu carrito está vacío');
  const list = element('ul', 'cart__lines');
  const cut = element('div', 'cart__cut');
  const total = element('p', 'cart__total');
  const totalLabel = element('span', 'cart__total-label', 'Total');
  const totalAmount = element('span', 'cart__total-amount');
  total.append(totalLabel, totalAmount);
  const pay = element('button', 'cart__pay', 'Pagar');
  pay.type = 'button';
  pay.addEventListener('click', () => onPay());
  contenedor.append(title, empty, list, cut, total, pay);

  // Un solo oyente para todos los botones de quitar
  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-seat-id]');
    if (button) {
      onRemove(button.dataset.seatId);
    }
  });

  function buildLine({ id, zone, price }) {
    const item = element('li', 'cart__line');
    const time = element('span', 'cart__time');
    const remove = element('button', 'cart__remove', '×');
    remove.type = 'button';
    remove.dataset.seatId = id;
    remove.setAttribute('aria-label', `Quitar la silla ${id}`);
    item.append(
      element('span', 'cart__seat', id),
      element('span', 'cart__zone', ZONE_LABELS[zone]),
      element('span', 'cart__price', formatPrice(price)),
      time,
      remove,
    );
    return { item, time };
  }

  return {
    render(state) {
      const items = myCart(state);
      const isEmpty = items.length === 0;
      empty.hidden = !isEmpty;
      list.hidden = isEmpty;
      cut.hidden = isEmpty;
      total.hidden = isEmpty;
      pay.hidden = isEmpty;

      const ids = new Set(items.map(({ id }) => id));
      lines.forEach((line, id) => {
        if (!ids.has(id)) {
          line.item.remove();
          lines.delete(id);
        }
      });

      items.forEach((seat, index) => {
        if (!lines.has(seat.id)) {
          lines.set(seat.id, buildLine(seat));
        }
        const { item, time } = lines.get(seat.id);
        setText(time, formatTime(seat.remaining));
        if (list.children[index] !== item) {
          list.insertBefore(item, list.children[index] || null);
        }
      });

      setText(totalAmount, formatPrice(items.reduce((sum, { price }) => sum + price, 0)));
    },
  };
}
