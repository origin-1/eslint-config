import { createRequire } from 'node:module';

const tsutilsPath = require.resolve('tsutils'); // eslint-disable-line n/no-extraneous-require
const tsutilsRequire = createRequire(tsutilsPath);
const originalGlobal = globalThis.global as typeof globalThis;
globalThis.global = { } as typeof globalThis;
try
{
    tsutilsRequire('tslib');
}
finally
{
    globalThis.global = originalGlobal;
}
