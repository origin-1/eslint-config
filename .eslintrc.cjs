'use strict';

const { createConfig } = require('./dist');

module.exports =
createConfig
(
    {
        env: { node: true },
        jsVersion: 2022,
        files: '*.js',
        parserOptions: { sourceType: 'module' },
    },
    {
        env: { node: true },
        jsVersion: 2022,
        files: ['*.cjs', 'dist/*.js'],
        parserOptions: { sourceType: 'script' },
    },
    {
        env: { node: true },
        tsVersion: 'latest',
        files: '*.ts',
        parserOptions: { project: 'tsconfig.json' },
    },
);
