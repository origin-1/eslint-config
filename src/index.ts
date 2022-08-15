import patchTslib from './patch-tslib.js';

patchTslib(require);

export * from './lib/create-config.js';
export * from './lib/normalize-version.js';
