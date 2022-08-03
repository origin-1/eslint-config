import assert               from 'node:assert/strict';
import { createRequire }    from 'node:module';
import { test }             from 'node:test';

const { default: patchTslib } = await import('../src/patch-tslib.js');

void test
(
    'patch-tslib',
    async (ctx): Promise<void> =>
    {
        await ctx.test
        (
            'does nothing if tsutils is not installed',
            (): void =>
            {
                const require = createRequire(import.meta.url);
                const resolve: NodeJS.RequireResolve =
                (): string =>
                {
                    throw Error('Test error');
                };
                resolve.paths = (): null => null;
                require.resolve = resolve;
                patchTslib(require);
            },
        );
        await ctx.test
        (
            'prevents global scope pollution',
            (): void =>
            {
                const require = createRequire(import.meta.url);
                patchTslib(require);
                assert(!('__assign' in global));
            },
        );
    },
);
