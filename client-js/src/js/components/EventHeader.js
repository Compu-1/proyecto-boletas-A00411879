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

// Encabezado del evento: marca, nombre, fecha, lugar y precio por zona. Sin evento no pinta datos.
export function EventHeader(contenedor) {
  return {
    render({ event }) {
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

      contenedor.append(
        element('p', 'event-header__brand', 'ICESI LIVE ARENA'),
        element('h1', 'event-header__name', name),
        element('p', 'event-header__meta', `${date} · ${venue}`),
        priceList,
      );
    },
  };
}
