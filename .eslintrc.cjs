'use strict';

const { createConfig } = require('./dist');

module.exports =
createConfig
(
    {
        env: { node: true },
        files: '*.js',
        jsVersion: 2022,
        parserOptions: { sourceType: 'module' },
    },
    {
        env: { node: true },
        files: ['*.cjs', 'dist/*.js'],
        jsVersion: 2022,
        parserOptions: { sourceType: 'script' },
    },
    {
        env: { node: true },
        files: '*.ts',
        parserOptions: { project: 'tsconfig.json' },
        tsVersion: 'latest',
    },
);
