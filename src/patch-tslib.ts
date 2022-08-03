import { createRequire } from 'node:module';

export default function patchTslib(require: NodeRequire): void
{
    let tsutilsPath: string;
    const { resolve } = require;
    try
    {
        tsutilsPath = resolve('tsutils');
    }
    catch
    {
        return;
    }
    const tsutilsRequire = createRequire(tsutilsPath);
    const originalGlobal = globalThis.global;
    globalThis.global = { } as typeof globalThis;
    try
    {
        tsutilsRequire('tslib');
    }
    finally
    {
        globalThis.global = originalGlobal;
    }
}
