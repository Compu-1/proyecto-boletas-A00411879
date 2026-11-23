import '../css/main.css';
import { connect, getEventInfo } from './api.js';
import { getState, setState, subscribe } from './store.js';
import { EventHeader } from './components/EventHeader.js';
import { ConnectionBanner } from './components/ConnectionBanner.js';

const eventHeader = EventHeader(document.getElementById('event-header'));
const connectionBanner = ConnectionBanner(document.getElementById('connection-banner'));

function render(state) {
  eventHeader.render(state);
  connectionBanner.render(state);
}

async function start() {
  subscribe(render);
  render(getState());
  try {
    // Si la conexión se pierde después, se avisa pero se conserva el evento que ya se veía
    await connect({ onDisconnect: () => setState({ connection: 'offline' }) });
    const event = await getEventInfo();
    setState({ connection: 'online', event });
  } catch (error) {
    console.error(error.message);
    setState({ connection: 'offline' });
  }
}

start();
