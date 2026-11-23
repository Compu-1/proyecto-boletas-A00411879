// Pesos con punto de miles y sin decimales: 120000 -> "$120.000"
export function formatPrice(valor) {
  return '$' + Math.round(valor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
