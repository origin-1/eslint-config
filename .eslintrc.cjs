'use strict';

const { createConfig } = require('./dist');

module.exports =
createConfig
(
    {
        files:          '*.js',
        jsVersion:      2022,
        env:            { node: true },
        parserOptions:  { sourceType: 'module' },
    },
    {
        files:          ['*.cjs', 'dist/*.js'],
        jsVersion:      2022,
        env:            { node: true },
        parserOptions:  { sourceType: 'script' },
    },
    {
        files:          '*.ts',
        tsVersion:      'latest',
        env:            { node: true },
        parserOptions:  { project: 'tsconfig.json' },
    },
);
