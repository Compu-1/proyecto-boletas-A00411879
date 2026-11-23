import { formatPrice, ZONE_LABELS } from '../format.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

// Comprobante del último pago en un <dialog> de panel blanco (D-039): código enorme, sillas con zona
// y precio, total, nombre y correo (D-042)
export function Receipt(contenedor, { onClose }) {
  let shown = null;
  contenedor.classList.add('panel', 'receipt');

  contenedor.addEventListener('cancel', (event) => {
    event.preventDefault();
    onClose();
  });

  function build({ code, items, total, name, email }) {
    const lines = element('ul', 'panel__lines');
    lines.append(
      ...items.map(({ id, zone, price }) => {
        const line = element('li', 'panel__line');
        line.append(
          element('span', 'panel__seat', id),
          element('span', 'panel__zone', ZONE_LABELS[zone]),
          element('span', 'panel__price', formatPrice(price)),
        );
        return line;
      }),
    );
    const totalRow = element('p', 'panel__total');
    totalRow.append(element('span', 'panel__tag', 'Total'), element('span', 'panel__total-amount', formatPrice(total)));
    const close = element('button', 'panel__button', 'Cerrar');
    close.type = 'button';
    close.addEventListener('click', () => onClose());

    contenedor.replaceChildren(
      element('p', 'panel__tag', 'Compra confirmada'),
      element('p', 'receipt__code', code),
      element('p', 'receipt__hint', 'Guarda este código'),
      lines,
      totalRow,
      element('p', 'receipt__buyer', name),
      element('p', 'receipt__buyer', email),
      close,
    );
  }

  return {
    render({ receipt }) {
      if (!receipt) {
        if (contenedor.open) {
          contenedor.close();
        }
        shown = null;
        return;
      }
      if (receipt !== shown) {
        shown = receipt;
        build(receipt);
      }
      if (!contenedor.open) {
        contenedor.showModal();
      }
    },
  };
}
