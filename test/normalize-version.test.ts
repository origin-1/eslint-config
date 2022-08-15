import assert                           from 'node:assert/strict';
import { test }                         from 'node:test';
import type { JSVersion, TSVersion }    from '../src/lib/normalize-version.js';

const { normalizeJSVersion, normalizeTSVersion } = await import('../src/lib/normalize-version.js');

void test
(
    'normalizeJSVersion',
    async (ctx): Promise<void> =>
    {
        const promises =
        [
            ctx.test
            (
                'defaults to 5',
                (): void =>
                {
                    assert.equal(normalizeJSVersion(undefined), 5);
                },
            ),
            ctx.test
            (
                'returns a supported value unchanged',
                (): void =>
                {
                    assert.equal(normalizeJSVersion(2015), 2015);
                },
            ),
            ctx.test
            (
                'fails for an unsupported value',
                (): void =>
                {
                    assert.throws
                    (
                        (): void => void normalizeJSVersion(6 as JSVersion),
                        {
                            constructor: TypeError,
                            message:
                            'jsVersion 6 is not supported. Valid values are 5, 2015, 2016, 2017, ' +
                            '2018, 2019, 2020, 2021, and 2022',
                        },
                    );
                },
            ),
        ];
        await Promise.all(promises);
    },
);

void test
(
    'normalizeTSVersion',
    async (ctx): Promise<void> =>
    {
        const promises =
        [
            ctx.test
            (
                'defaults to "latest"',
                (): void =>
                {
                    assert.equal(normalizeTSVersion(undefined), 'latest');
                },
            ),
            ctx.test
            (
                'returns a supported value unchanged',
                (): void =>
                {
                    assert.equal(normalizeTSVersion('4.6.0-beta'), '4.6.0-beta');
                },
            ),
            ctx.test
            (
                'fails for an unsupported value',
                (): void =>
                {
                    assert.throws
                    (
                        (): void => void normalizeTSVersion('4.0' as TSVersion),
                        {
                            constructor: TypeError,
                            message: 'tsVersion \'4.0\' is not supported',
                        },
                    );
                },
            ),
        ];
        await Promise.all(promises);
    },
);
