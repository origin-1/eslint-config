#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';

async function readJSON(url)
{
    const data = await readFile(url, 'utf-8');
    const json = JSON.parse(data);
    return json;
}

async function updatePackage()
{
    const srcPkgURL = makeURL('package.json');
    const targetPkgURL = makeURL('dist/package.json');
    const [src, target] = await Promise.all([srcPkgURL, targetPkgURL].map(readJSON));
    target.dependencies     = src.dependencies;
    target.peerDependencies = src.peerDependencies;
    const data = `${JSON.stringify(target, null, 2)}\n`;
    await writeFile(targetPkgURL, data);
}

const pkgDirURL = new URL('..', import.meta.url);
const makeURL = url => new URL(url, pkgDirURL);
await updatePackage();
