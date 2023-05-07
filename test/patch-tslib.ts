import { createRequire } from 'node:module';

const require: NodeRequire = createRequire(import.meta.url);
const { default: patchTslib } = await import('../src/patch-tslib.js');
patchTslib(require);
