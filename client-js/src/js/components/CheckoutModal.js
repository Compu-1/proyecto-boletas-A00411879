import { formatPrice, ZONE_LABELS } from '../format.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function field(labelText, type, autocomplete) {
  const label = element('label', 'panel__field', labelText);
  const input = element('input', 'panel__input');
  input.type = type;
  input.autocomplete = autocomplete;
  label.append(input);
  return { label, input };
}

// Pago en un <dialog> de panel blanco (D-039): resumen de las sillas congeladas al abrir (D-038),
// nombre, correo y el error del último intento. El formulario no valida: lo hace el servidor (D-037).
export function CheckoutModal(contenedor, { onConfirm, onCancel }) {
  let shownItems = null;
  contenedor.classList.add('panel', 'checkout');

  const tag = element('p', 'panel__tag', 'Pago');
  const title = element('h2', 'panel__title', 'Confirma tu compra');
  const summary = element('ul', 'panel__lines');
  const total = element('p', 'panel__total');
  const totalLabel = element('span', 'panel__tag', 'Total');
  const totalAmount = element('span', 'panel__total-amount');
  total.append(totalLabel, totalAmount);

  const form = element('form', 'checkout__form');
  form.noValidate = true;
  const name = field('Nombre', 'text', 'name');
  const email = field('Correo', 'email', 'email');
  const error = element('p', 'panel__error');
  error.setAttribute('role', 'alert');
  const actions = element('div', 'panel__actions');
  const cancel = element('button', 'panel__button panel__button--secondary', 'Cancelar');
  cancel.type = 'button';
  const confirm = element('button', 'panel__button', 'Confirmar');
  confirm.type = 'submit';
  actions.append(cancel, confirm);
  form.append(name.label, email.label, error, actions);
  contenedor.append(tag, title, summary, total, form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onConfirm({ name: name.input.value, email: email.input.value });
  });
  cancel.addEventListener('click', () => onCancel());
  // Esc: el diálogo lo cierra el estado, no el navegador
  contenedor.addEventListener('cancel', (event) => {
    event.preventDefault();
    onCancel();
  });

  function showItems(items) {
    summary.replaceChildren(
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
    totalAmount.textContent = formatPrice(items.reduce((sum, { price }) => sum + price, 0));
  }

  return {
    render({ checkout }) {
      if (!checkout) {
        if (contenedor.open) {
          contenedor.close();
        }
        shownItems = null;
        return;
      }
      if (!contenedor.open) {
        form.reset();
        contenedor.showModal();
        name.input.focus();
      }
      // El reloj repinta cuatro veces por segundo: el resumen solo se rehace si cambió la lista
      if (checkout.items !== shownItems) {
        shownItems = checkout.items;
        showItems(checkout.items);
      }
      if (error.textContent !== checkout.error) {
        error.textContent = checkout.error;
      }
      error.hidden = !checkout.error;
      confirm.disabled = checkout.sending;
    },
  };
}
