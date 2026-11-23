import { formatPrice } from '../format.js';
import { visibleState } from '../seats.js';

const ZONES = [
  { key: 'vip', label: 'VIP' },
  { key: 'platea', label: 'Platea' },
  { key: 'general', label: 'General' },
];

const LEGEND = [
  { modifier: 'available', label: 'Disponible' },
  { modifier: 'mine', label: 'Tuya' },
  { modifier: 'other', label: 'Retenida por otro' },
  { modifier: 'booked', label: 'Vendida' },
];

const STATE_LABELS = {
  available: 'disponible',
  mine: 'tuya',
  other: 'retenida por otro',
  booked: 'vendida',
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function buildLegend() {
  const legend = element('div', 'seat-map__legend');
  LEGEND.forEach(({ modifier, label }) => {
    const item = element('span', 'seat-map__legend-item');
    item.append(element('i', `seat-map__seat seat-map__seat--${modifier} seat-map__seat--sample`), label);
    legend.append(item);
  });
  return legend;
}

// Plano de sillas: escenario, zonas, filas y leyenda. La estructura se arma una vez con las sillas
// recibidas y en cada render solo se actualiza el aspecto de cada botón (no se pierde el foco).
// Solo las sillas disponibles, sin retención en curso y con conexión avisan el clic (D-027).
export function SeatMap(contenedor, { onSeatClick }) {
  const buttons = new Map();
  contenedor.classList.add('seat-map');

  // Un solo oyente para las 90 sillas
  contenedor.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-seat-id]');
    if (button && !button.disabled) {
      onSeatClick(button.dataset.seatId);
    }
  });

  function build(seats) {
    const stage = element('p', 'seat-map__stage', 'Escenario');
    const zones = ZONES.map(({ key, label }) => {
      const zoneSeats = seats.filter((seat) => seat.zone === key);
      const zone = element('section', 'seat-map__zone');
      zone.append(element('h2', 'seat-map__zone-name', `${label} · ${formatPrice(zoneSeats[0].price)}`));
      [...new Set(zoneSeats.map((seat) => seat.row))].forEach((row) => {
        const rowNode = element('div', 'seat-map__row');
        rowNode.append(element('span', 'seat-map__row-letter', row));
        zoneSeats
          .filter((seat) => seat.row === row)
          .forEach(({ id }) => {
            const button = element('button', 'seat-map__seat', '');
            button.type = 'button';
            button.dataset.seatId = id;
            buttons.set(id, button);
            rowNode.append(button);
          });
        zone.append(rowNode);
      });
      return zone;
    });
    contenedor.replaceChildren(stage, ...zones, buildLegend());
  }

  return {
    render({ seats, clientId, pendingSeats, connection, now, releasedSeats }) {
      if (seats.length === 0) {
        return;
      }
      if (buttons.size === 0) {
        build(seats);
      }
      const offline = connection === 'offline';
      contenedor.classList.toggle('seat-map--offline', offline);
      seats.forEach((seat) => {
        const button = buttons.get(seat.id);
        const state = visibleState(seat, { clientId, now, releasedSeats });
        // Solo se toca el DOM si algo cambió: el plano se repinta cada segundo
        const className = `seat-map__seat seat-map__seat--${state}`;
        if (button.className !== className) {
          button.className = className;
          button.setAttribute('aria-label', `Silla ${seat.id}, ${STATE_LABELS[state]}`);
        }
        const disabled = state !== 'available' || pendingSeats.has(seat.id) || offline;
        if (button.disabled !== disabled) {
          button.disabled = disabled;
        }
      });
    },
  };
}
