#!/usr/bin/env node

import { copyFile, readFile, writeFile } from 'node:fs/promises';

async function readJSON(url)
{
    const data = await readFile(url, 'utf-8');
    const json = JSON.parse(data);
    return json;
}

async function updatePackage()
{
    const referencePkgURL   = makeURL('package.json');
    const templatePkgURL    = makeURL('src/package.template.json');
    const targetPkgURL      = makeURL('dist/package.json');
    const [{ dependencies, peerDependencies }, pkg] =
    await Promise.all([referencePkgURL, templatePkgURL].map(readJSON));
    pkg.dependencies        = dependencies;
    pkg.peerDependencies    = peerDependencies;
    const data = `${JSON.stringify(pkg, null, 2)}\n`;
    await writeFile(targetPkgURL, data);
}

const pkgDirURL = new URL('..', import.meta.url);
const makeURL = url => new URL(url, pkgDirURL);
await Promise.all
(
    [
        updatePackage(),
        copyFile(makeURL('LICENSE'), makeURL('dist/LICENSE')),
        copyFile(makeURL('README.md'), makeURL('dist/README.md')),
    ],
);
