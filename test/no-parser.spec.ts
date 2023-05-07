import assert   from 'node:assert/strict';
import { it }   from 'mocha';

const { parse } = await import('../src/no-parser.js');

it
(
    'no-parser throws an error',
    (): void =>
    {
        assert.throws(parse, 'missing configuration for this files');
    },
);
