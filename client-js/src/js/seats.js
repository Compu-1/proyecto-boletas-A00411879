// Funciones puras sobre las sillas: sin red, sin DOM y sin estado propio.
// Plano, contadores y carrito las usan para ver siempre lo mismo.

// Estado visible de una silla para este comprador: 'available' | 'mine' | 'other' | 'booked'.
// Una silla mía que ya venció (D-033) o que el comprador quitó (D-034) se ve disponible
// aunque el servidor todavía no lo haya confirmado.
export function visibleState(seat, { clientId, now, releasedSeats }) {
  const { id, state, lockedBy, expiresAt } = seat;
  if (state !== 'locked') {
    return state;
  }
  if (lockedBy !== clientId) {
    return 'other';
  }
  return releasedSeats.has(id) || expiresAt <= now ? 'available' : 'mine';
}

// Segundos que le quedan a una retención, redondeados hacia arriba: recién retenida muestra 90
export function remainingSeconds({ expiresAt }, now) {
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

// Sillas del carrito: las mías vigentes, de la que vence primero a la que vence después
// (es el orden en que se retuvieron, porque todas duran lo mismo)
export function myCart({ seats, clientId, now, releasedSeats }) {
  return seats
    .filter((seat) => visibleState(seat, { clientId, now, releasedSeats }) === 'mine')
    .sort((a, b) => a.expiresAt - b.expiresAt)
    .map((seat) => ({ id: seat.id, zone: seat.zone, price: seat.price, remaining: remainingSeconds(seat, now) }));
}

// 90 -> "01:30"
export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
