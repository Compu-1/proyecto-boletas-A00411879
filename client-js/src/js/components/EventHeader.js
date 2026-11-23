import { formatPrice } from '../format.js';

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
function countSeats(seats) {
  return {
    available: seats.filter(({ state }) => state === 'available').length,
    locked: seats.filter(({ state }) => state === 'locked').length,
    booked: seats.filter(({ state }) => state === 'booked').length,
  };
}

// Encabezado del evento: marca, nombre, fecha, lugar, precio por zona y contadores del aforo.
// Sin evento no pinta datos; sin sillas todavía no pinta contadores.
export function EventHeader(contenedor) {
  return {
    render({ event, seats }) {
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

      if (seats.length > 0) {
        const { available, locked, booked } = countSeats(seats);
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
