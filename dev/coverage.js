#!/usr/bin/env node

import c8js, { commands } from 'c8js';

await c8js
(
    commands.npm,
    ['test'],
    {
        all: true,
        cwd: new URL('..', import.meta.url),
        reporter: ['html', 'text-summary'],
        src: 'src',
        useC8Config: false,
        watermarks:
        {
            branches:   [90, 100],
            functions:  [90, 100],
            lines:      [90, 100],
            statements: [90, 100],
        },
    },
);
