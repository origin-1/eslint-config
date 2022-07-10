#!/usr/bin/env node

import { rm } from 'node:fs/promises';

const RM_OPTIONS = { force: true, recursive: true };

const pkgDirURL = new URL('..', import.meta.url);
const promises =
['coverage', 'dist/lib'].map
(
    async url =>
    {
        const fullURL = new URL(url, pkgDirURL);
        await rm(fullURL, RM_OPTIONS);
    },
);
await Promise.all(promises);
