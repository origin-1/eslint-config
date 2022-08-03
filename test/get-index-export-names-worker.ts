// Loads index.js in a worker realm because we need to mess around with the global object.
// Posts the exported names to the main thread.

import { createRequire }    from 'node:module';
import { parentPort }       from 'node:worker_threads';

global.require = createRequire(import.meta.url);
const namespace = await import('../src/index.js');
const exportNames = Object.keys(namespace);
parentPort!.postMessage(exportNames);
