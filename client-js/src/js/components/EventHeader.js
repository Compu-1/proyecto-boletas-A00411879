import { formatPrice } from '../format.js';
import { visibleState } from '../seats.js';

const ZONES = [
  { key: 'vip', label: 'VIP' },
  { key: 'platea', label: 'Platea' },
  { key: 'general', label: 'General' },
];

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

// Contadores del aforo, contados de la misma lista de sillas que pinta el plano (D-024):
// así Disponibles + Retenidas + Vendidas siempre suman las sillas que se ven
function countSeats(seats, view) {
  const states = seats.map((seat) => visibleState(seat, view));
  return {
    available: states.filter((state) => state === 'available').length,
    locked: states.filter((state) => state === 'mine' || state === 'other').length,
    booked: states.filter((state) => state === 'booked').length,
  };
}

// Encabezado del evento: marca, nombre, fecha, lugar, precio por zona y contadores del aforo.
// Sin evento no pinta datos; sin sillas todavía no pinta contadores.
export function EventHeader(contenedor) {
  let lastKey = null;
  return {
    render({ event, seats, clientId, now, releasedSeats }) {
      // El reloj repinta cuatro veces por segundo (D-032): solo se reconstruye si cambió algo
      const counts = seats.length > 0 ? countSeats(seats, { clientId, now, releasedSeats }) : null;
      const key = JSON.stringify([event, counts]);
      if (key === lastKey) {
        return;
      }
      lastKey = key;
      contenedor.replaceChildren();
      if (!event) {
        return;
      }
      const { name, date, venue, prices } = event;

      const priceList = element('ul', 'event-header__prices');
      ZONES.forEach(({ key, label }) => {
        const item = element('li', 'event-header__price');
        item.append(
          element('span', 'event-header__zone', label),
          element('span', 'event-header__amount', formatPrice(prices[key])),
        );
        priceList.append(item);
      });

      const info = element('div', 'event-header__info');
      info.append(
        element('p', 'event-header__brand', 'ICESI LIVE ARENA'),
        element('h1', 'event-header__name', name),
        element('p', 'event-header__meta', `${date} · ${venue}`),
        priceList,
      );
      contenedor.append(info);

      if (counts) {
        const { available, locked, booked } = counts;
        const counters = element('ul', 'event-header__counters');
        [
          ['Disponibles', available],
          ['Retenidas', locked],
          ['Vendidas', booked],
        ].forEach(([label, total]) => {
          const item = element('li', 'event-header__counter');
          item.append(
            element('span', 'event-header__counter-total', String(total)),
            element('span', 'event-header__counter-label', label),
          );
          counters.append(item);
        });
        contenedor.append(counters);
      }
    },
  };
}
