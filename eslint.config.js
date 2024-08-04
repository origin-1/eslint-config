import { createConfig } from './dist/index.js';
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
);
