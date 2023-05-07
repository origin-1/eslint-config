import assert               from 'node:assert/strict';
import { createRequire }    from 'node:module';
import { describe, it }     from 'mocha';

const { default: patchTslib } = await import('../src/patch-tslib.js');

describe
(
    'patch-tslib',
    (): void =>
    {
        it
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

        it
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
