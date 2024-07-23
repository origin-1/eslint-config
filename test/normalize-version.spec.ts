import assert                           from 'node:assert/strict';
import type { JSVersion, TSVersion }    from '../src/lib/normalize-version.js';
import { describe, it }                 from 'mocha';

const { normalizeJSVersion, normalizeTSVersion } = await import('../src/lib/normalize-version.js');

describe
(
    'normalizeJSVersion',
    (): void =>
    {
        it
        (
            'defaults to 5',
            (): void =>
            {
                assert.equal(normalizeJSVersion(undefined), 5);
            },
        );

        it
        (
            'returns a supported value unchanged',
            (): void =>
            {
                assert.equal(normalizeJSVersion(2015), 2015);
            },
        );

        it
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
                        '2018, 2019, 2020, 2021, 2022, 2023, 2024, and 2025',
                    },
                );
            },
        );
    },
);

describe
(
    'normalizeTSVersion',
    (): void =>
    {
        it
        (
            'defaults to "latest"',
            (): void =>
            {
                assert.equal(normalizeTSVersion(undefined), 'latest');
            },
        );

        it
        (
            'returns a supported value unchanged',
            (): void =>
            {
                assert.equal(normalizeTSVersion('4.6.0-beta'), '4.6.0-beta');
            },
        );

        it
        (
            'fails for an unsupported value',
            (): void =>
            {
                assert.throws
                (
                    (): void => void normalizeTSVersion('4.0' as TSVersion),
                    {
                        constructor:    TypeError,
                        message:        'tsVersion \'4.0\' is not supported',
                    },
                );
            },
        );
    },
);
