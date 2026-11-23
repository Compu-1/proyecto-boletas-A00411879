// Genera src/js/generated/ desde el contrato Slice del backend (única fuente del contrato)
const fs = require('fs');
const path = require('path');
const slice2js = require('slice2js');

const root = path.resolve(__dirname, '..');
const ice = path.resolve(root, '../codigo_base/common/src/main/slice/BookingService.ice');
const out = path.resolve(root, 'src/js/generated');

fs.mkdirSync(out, { recursive: true });

slice2js.compile(['--output-dir', out, ice], { stdio: 'inherit' }).on('close', (code) => {
  process.exit(code);
});
