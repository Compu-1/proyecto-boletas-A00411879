// Pesos con punto de miles y sin decimales, p. ej. "$120.000"
export function formatPrice(valor) {
  return '$' + Math.round(valor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Nombre de cada zona tal como lo ve el comprador
export const ZONE_LABELS = { vip: 'VIP', platea: 'Platea', general: 'General' };
