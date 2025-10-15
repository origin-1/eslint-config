import assert           from 'node:assert/strict';
import { describe, it } from 'mocha';

const { normalizeJSONVersion, normalizeJSVersion, normalizeTSVersion } =
await import('../src/lib/normalize-version.js');

describe
(
    'normalizeJSONVersion',
    (): void =>
    {
        it
        (
            'defaults to "standard"',
            (): void =>
            {
                assert.equal(normalizeJSONVersion(undefined), 'standard');
            },
        );

        it
        (
            'returns a supported value unchanged',
            (): void =>
            {
                assert.equal(normalizeJSONVersion('standard'), 'standard');
            },
        );

        it
        (
            'fails for an unsupported value',
            (): void =>
            {
                assert.throws
                (
                    (): void => void normalizeJSONVersion('latest'),
                    {
                        constructor: TypeError,
                        message:
                        'jsonVersion \'latest\' is not supported. Only \'standard\' is supported',
                    },
                );
            },
        );
    },
);

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
                    (): void => void normalizeJSVersion(6),
                    {
                        constructor: TypeError,
                        message:
                        'jsVersion 6 is not supported. Valid values are 5, 2015, 2016, 2017, ' +
                        '2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, and 2026',
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
                    (): void => void normalizeTSVersion('4.0'),
                    {
                        constructor:    TypeError,
                        message:        'tsVersion \'4.0\' is not supported',
                    },
                );
            },
        );
    },
);
