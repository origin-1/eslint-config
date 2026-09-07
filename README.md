# @origin-1/eslint-config · [![npm version][npm badge]][npm url]

[ESLint](https://eslint.org/) configuration generator with [Origin₁](https://github.com/origin-1)
presets.

## Installation

```console
npm i -D @origin-1/eslint-config
```

## Usage

`createConfig` takes a list of config objects and returns a promise that resolves to an array of
[ESLint config objects](https://eslint.org/docs/latest/use/configure/configuration-files).
Export it directly from `eslint.config.js`: ESLint awaits the promise on its own.

```js
import { createConfig } from '@origin-1/eslint-config';

export default createConfig
(
    { ignores: ['coverage', 'dist'] },
    {
        files:      ['**/*.js'],
        jsVersion:  2022,
    },
    {
        files:      ['**/*.ts'],
        tsVersion:  'latest',
    },
);
```

Each config object accepts the regular ESLint config properties, plus one of the language version
properties below. A config object that specifies a language version is expanded into a full
configuration: the matching Origin₁ preset rules, the required plugins and parser, and sensible
`languageOptions` defaults. Config objects without a language version — like the `ignores` entry
above — are passed through unchanged.

Only one language version property can be specified in the same config object.

| Property      | Values                                                       |
|---------------|--------------------------------------------------------------|
| `jsVersion`   | `5`, `2015`, `2016`, … `2026`                                |
| `jsonVersion` | `'standard'`                                                 |
| `tsVersion`   | `'latest'`, or a TypeScript version like `'5.4.0'`           |

The specified version also selects how the preset rules are configured: rules and options that only
apply to newer language versions are adjusted or turned off when an older version is given.

Explicitly provided settings always override the preset ones, so a config object can be tuned as
usual.

```js
import { createConfig } from '@origin-1/eslint-config';
import globals          from 'globals';

export default createConfig
(
    {
        files:              ['**/*.ts'],
        tsVersion:          '5.4.0',
        languageOptions:    { globals: globals.node },
        rules:              { 'no-console': 'off' },
    },
);
```

[npm badge]: https://img.shields.io/npm/v/@origin-1%2Feslint-config?logo=npm
[npm url]: https://www.npmjs.com/package/@origin-1/eslint-config
