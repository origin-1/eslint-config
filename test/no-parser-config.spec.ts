import assert   from 'node:assert/strict';
import { it }   from 'mocha';

const { noParserConfig: { languageOptions: { parser } } } =
await import('../src/lib/no-parser-config.js');

it
(
    'no-parser throws an error',
    (): void => { assert.throws(parser.parse, 'missing configuration for this files'); },
);
