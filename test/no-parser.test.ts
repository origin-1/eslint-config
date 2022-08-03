import assert   from 'node:assert/strict';
import { test } from 'node:test';

const { parse } = await import('../src/no-parser.js');

void test
(
    'no-parser throws an error',
    (): void =>
    {
        assert.throws(parse, 'missing configuration for this files');
    },
);
