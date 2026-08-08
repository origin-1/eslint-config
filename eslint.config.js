import { createConfig } from './dist/index.js';
import origin1          from '@origin-1/eslint-plugin';
import globals          from 'globals';

export default createConfig
(
    { ignores: ['**/.*', 'coverage', 'dist'] },
    {
        files:              ['**/*.{js,ts}'],
        languageOptions:    { globals: globals.node },
    },
    {
        files:              ['**/*.js'],
        jsVersion:          2022,
        languageOptions:    { sourceType: 'module' },
    },
    {
        files:              ['**/*.ts'],
        tsVersion:          'latest',
    },
    {
        files:              ['**/*.json'],
        jsonVersion:        'standard',
    },
    {
        files:              ['**/tsconfig.json'],
        language:           'json/jsonc',
        languageOptions:    { allowTrailingCommas: true },
    },
    {
        files:              ['**/{,*.}package.json'],
        plugins:            { '@origin-1': origin1 },
        rules:              { '@origin-1/package-json-fields': 'error' },
    },
);
