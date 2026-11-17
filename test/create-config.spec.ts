import assert               from 'node:assert/strict';
import { createRequire }    from 'node:module';
import type { ConfigData }  from '../src/lib/create-config.js';
import type { JSVersion }   from '../src/lib/normalize-version.js';
import type { Linter }      from 'eslint';
import { describe, it }     from 'mocha';

const { createConfig } = await import('../src/lib/create-config.js');

async function assertRules
(configData: ConfigData, expectedRules: Record<string, Linter.RuleEntry | undefined>):
Promise<void>
{
    const [{ rules }] = await createConfig(configData);
    assert(rules);
    const actualRules: Record<string, Linter.RuleEntry | undefined> = { };
    for (const ruleKey of Object.keys(expectedRules))
        actualRules[ruleKey] = rules[ruleKey];
    assert.deepEqual(actualRules, expectedRules);
}

describe
(
    'createConfig',
    (): void =>
    {
        it
        (
            'without a language',
            async (): Promise<void> =>
            {
                const files: string[]   = [];
                const ignores: string[] = [];
                const languageOptions   = { };
                const linterOptions     = { };
                const plugins           = { };
                const processor         = 'foo';
                const rules             = { };
                const settings          = { };
                const [config] =
                await createConfig
                (
                    {
                        files,
                        ignores,
                        languageOptions,
                        linterOptions,
                        plugins,
                        processor,
                        rules,
                        settings,
                    },
                );
                assert.equal(config.files, files);
                assert.equal(config.ignores, ignores);
                assert.equal(config.languageOptions, languageOptions);
                assert.equal(config.linterOptions, linterOptions);
                assert.equal(config.plugins, plugins);
                assert.equal(config.processor, processor);
                assert.equal(config.rules, rules);
                assert.equal(config.settings, settings);
            },
        );

        it
        (
            'with both `jsVersion` and `tsVersion specified`',
            async (): Promise<void> =>
            {
                await assert.rejects
                (
                    async (): Promise<unknown> =>
                    createConfig({ jsVersion: 5, tsVersion: 'latest' }),
                    {
                        constructor: TypeError,
                        message:
                        'Only one of `jsonVersion`, `jsVersion`, and `tsVersion` can be ' +
                        'specified at the same time',
                    },
                );
            },
        );

        it
        (
            '`files` and `ignores` are set',
            async (): Promise<void> =>
            {
                const files = ['foo', 'bar'];
                const ignores = ['baz'];
                const [config] = await createConfig({ files, ignores });
                assert.equal(config.files, files);
                assert.equal(config.ignores, ignores);
                assert(!('languageOptions' in config));
                assert(!('parser' in config));
                assert(!('rules' in config));
            },
        );

        it
        (
            '`jsVersion` is not set',
            async (): Promise<void> =>
            {
                const [config] = await createConfig({ jsVersion: 5 });
                assert(!('jsVersion' in config));
            },
        );

        it
        (
            '`jsonVersion` is not set',
            async (): Promise<void> =>
            {
                const [config] = await createConfig({ jsonVersion: 'standard' });
                assert(!('jsonVersion' in config));
            },
        );

        it
        (
            '`tsVersion` is not set',
            async (): Promise<void> =>
            {
                const [config] = await createConfig({ tsVersion: '6.0.0' });
                assert(!('tsVersion' in config));
            },
        );

        it
        (
            '`rules` are set',
            async (): Promise<void> =>
            {
                const [{ rules }] = await createConfig({ jsVersion: 5, rules: { foobar: 'warn' } });
                assert(rules);
                assert('eqeqeq' in rules);
                assert('@origin-1/no-spaces-in-call-expression' in rules);
                assert(!('@origin-1/package-json-fields' in rules));
                assert('no-undef' in rules);
                assert('dot-notation' in rules);
                assert('no-redeclare' in rules);
                assert('n/prefer-promises/fs' in rules);
                assert.equal(rules.foobar, 'warn');
            },
        );

        describe
        (
            'versioned `rules` are set for JavaScript',
            (): void =>
            {
                it
                (
                    'unique rule',
                    async (): Promise<void> =>
                    {
                        const ruleKey = 'no-var';
                        await assertRules({ jsVersion: 5 }, { [ruleKey]: 'off' });
                        await assertRules({ jsVersion: 2015 }, { [ruleKey]: 'error' });
                        await assertRules({ jsVersion: 2026 }, { [ruleKey]: 'error' });
                    },
                );

                it
                (
                    'hybrid rule',
                    async (): Promise<void> =>
                    {
                        const ruleKey = 'prefer-destructuring';
                        await assertRules({ jsVersion: 5 }, { [ruleKey]: 'off' });
                        await assertRules({ jsVersion: 2015 }, { [ruleKey]: 'error' });
                        await assertRules({ jsVersion: 2026 }, { [ruleKey]: 'error' });
                    },
                );

                it
                (
                    'plugin rule',
                    async (): Promise<void> =>
                    {
                        const ruleKey = 'n/prefer-node-protocol';
                        await assertRules({ jsVersion: 2020 }, { [ruleKey]: 'off' });
                        await assertRules({ jsVersion: 2021 }, { [ruleKey]: 'error' });
                        await assertRules({ jsVersion: 2026 }, { [ruleKey]: 'error' });
                    },
                );

                it
                (
                    'rule with multiple version thresholds',
                    async (): Promise<void> =>
                    {
                        const expectedRuleEntries: [JSVersion, Linter.RuleEntry][] =
                        [
                            [5,     ['error', { caughtErrors: 'none' }]],
                            [2017,  ['error', { caughtErrors: 'none' }]],
                            [2018,  ['error', { caughtErrors: 'none', ignoreRestSiblings: true }]],
                            [2019,  ['error', { ignoreRestSiblings: true }]],
                            [2026,  ['error', { ignoreRestSiblings: true }]],
                        ];
                        for (const [jsVersion, ruleEntry] of expectedRuleEntries)
                            await assertRules({ jsVersion }, { 'no-unused-vars': ruleEntry });
                    },
                );

                it
                (
                    'rule versioned for TypeScript only',
                    async (): Promise<void> =>
                    {
                        const ruleKey = 'no-duplicate-imports';
                        await assertRules({ jsVersion: 5 }, { [ruleKey]: 'error' });
                        await assertRules({ jsVersion: 2026 }, { [ruleKey]: 'error' });
                    },
                );
            },
        );

        describe
        (
            '`plugins` are set',
            (): void =>
            {
                it
                (
                    'for JavaScript',
                    async (): Promise<void> =>
                    {
                        const [{ plugins }] =
                        await createConfig({ jsVersion: 5, plugins: { barbaz: { } } });
                        assert(plugins);
                        assert.deepEqual
                        (
                            Object.keys(plugins),
                            [
                                '@origin-1',
                                '@eslint-community/eslint-comments',
                                '@stylistic',
                                'n',
                                'barbaz',
                            ],
                        );
                    },
                );

                it
                (
                    'for TypeScript',
                    async (): Promise<void> =>
                    {
                        const [{ plugins }] =
                        await createConfig({ plugins: { barbaz: { } }, tsVersion: 'latest' });
                        assert(plugins);
                        assert.deepEqual
                        (
                            Object.keys(plugins),
                            [
                                '@origin-1',
                                '@eslint-community/eslint-comments',
                                '@stylistic',
                                'n',
                                '@typescript-eslint',
                                'barbaz',
                            ],
                        );
                    },
                );

                it
                (
                    'for JSON',
                    async (): Promise<void> =>
                    {
                        const [{ plugins }] =
                        await createConfig({ plugins: { barbaz: { } }, jsonVersion: 'standard' });
                        assert(plugins);
                        assert.deepEqual(Object.keys(plugins), ['json', 'barbaz']);
                    },
                );
            },
        );

        describe
        (
            '`languageOptions` and `linterOptions` are set',
            (): void =>
            {
                describe
                (
                    'for JavaScript',
                    (): void =>
                    {
                        it
                        (
                            'defaults and merging',
                            async (): Promise<void> =>
                            {
                                const { resolve } = createRequire(import.meta.url);
                                const requireAsESLint = createRequire(resolve('eslint'));
                                const espree = requireAsESLint('espree') as Linter.ESTreeParser;
                                const [{ languageOptions, linterOptions }] =
                                await createConfig
                                (
                                    {
                                        jsVersion:          2015,
                                        languageOptions:    { sourceType: 'module' },
                                        linterOptions:      { noInlineConfig: false },
                                    },
                                );
                                assert(languageOptions);
                                assert.equal(languageOptions.ecmaVersion, 2015);
                                assert.equal(languageOptions.parser, espree);
                                assert.equal(languageOptions.sourceType, 'module');
                                assert(linterOptions);
                                assert.equal(linterOptions.noInlineConfig, false);
                                assert.equal(linterOptions.reportUnusedDisableDirectives, 'error');
                            },
                        );

                        it
                        (
                            'overwriting',
                            async (): Promise<void> =>
                            {
                                const parser = { } as Linter.Parser;
                                const [{ languageOptions, linterOptions }] =
                                await createConfig
                                (
                                    {
                                        jsVersion:          2015,
                                        languageOptions:    { ecmaVersion: 'latest', parser },
                                        linterOptions:
                                        { reportUnusedDisableDirectives: false },
                                    },
                                );
                                assert(languageOptions);
                                assert.equal(languageOptions.ecmaVersion, 'latest');
                                assert.equal(languageOptions.parser, parser);
                                assert(linterOptions);
                                assert.equal(linterOptions.reportUnusedDisableDirectives, false);
                            },
                        );
                    },
                );

                describe
                (
                    'for TypeScript',
                    (): void =>
                    {
                        it
                        (
                            'defaults and merging',
                            async (): Promise<void> =>
                            {
                                const parser = await import('@typescript-eslint/parser');
                                const [{ languageOptions, linterOptions }] =
                                await createConfig
                                (
                                    {
                                        languageOptions:    { parserOptions: { project: false } },
                                        linterOptions:      { noInlineConfig: true },
                                        tsVersion:          'latest',
                                    },
                                );
                                assert(languageOptions);
                                assert.equal(languageOptions.ecmaVersion, 'latest');
                                assert.equal(languageOptions.parser, parser);
                                assert.deepEqual
                                (
                                    languageOptions.parserOptions,
                                    { project: false, projectService: true },
                                );
                                assert(linterOptions);
                                assert.equal(linterOptions.noInlineConfig, true);
                                assert.equal(linterOptions.reportUnusedDisableDirectives, 'error');
                            },
                        );

                        it
                        (
                            'overwriting',
                            async (): Promise<void> =>
                            {
                                const parser = await import('@typescript-eslint/parser');
                                const projectService =
                                {
                                    allowDefaultProject:    ['./*.js'],
                                    defaultProject:         './tsconfig.json',
                                };
                                const [{ languageOptions, linterOptions }] =
                                await createConfig
                                (
                                    {
                                        languageOptions:
                                        {
                                            ecmaVersion:    2019,
                                            parserOptions:  { projectService },
                                        },
                                        linterOptions:
                                        { reportUnusedDisableDirectives: false },
                                        tsVersion: 'latest',
                                    },
                                );
                                assert(languageOptions);
                                assert.equal(languageOptions.ecmaVersion, 2019);
                                assert.equal(languageOptions.parser, parser);
                                assert.deepEqual(languageOptions.parserOptions, { projectService });
                                assert.equal
                                (languageOptions.parserOptions.projectService, projectService);
                                assert(linterOptions);
                                assert.equal(linterOptions.reportUnusedDisableDirectives, false);
                            },
                        );
                    },
                );

                describe
                (
                    'for JSON',
                    (): void =>
                    {
                        it
                        (
                            'defaults and merging',
                            async (): Promise<void> =>
                            {
                                const { default: json } = await import('@eslint/json');
                                const [{ language, languageOptions, linterOptions, plugins }] =
                                await createConfig
                                (
                                    {
                                        jsonVersion:        'standard',
                                        languageOptions:    { allowTrailingCommas: true },
                                        linterOptions:      { noInlineConfig: false },
                                    },
                                );
                                assert.equal(language, 'json/json');
                                assert.deepEqual(languageOptions, { allowTrailingCommas: true });
                                assert(linterOptions);
                                assert.equal(linterOptions.noInlineConfig, false);
                                assert.equal(linterOptions.reportUnusedDisableDirectives, 'error');
                                assert(plugins);
                                assert.deepEqual(Object.keys(plugins), ['json']);
                                assert.equal(plugins.json, json);
                            },
                        );

                        it
                        (
                            'overwriting',
                            async (): Promise<void> =>
                            {
                                const [{ language, linterOptions }] =
                                await createConfig
                                (
                                    {
                                        jsonVersion:    'standard',
                                        language:       'json/jsonc',
                                        linterOptions:
                                        { reportUnusedDisableDirectives: false },
                                    },
                                );
                                assert.equal(language, 'json/jsonc');
                                assert(linterOptions);
                                assert.equal(linterOptions.reportUnusedDisableDirectives, false);
                            },
                        );
                    },
                );
            },
        );

        it
        (
            '`globals` and `processor` are set',
            async (): Promise<void> =>
            {
                const globals = { '$': true };
                const processor = 'barfoo';
                const [config] = await createConfig({ languageOptions: { globals }, processor });
                assert.equal(config.languageOptions?.globals, globals);
                assert.equal(config.processor, processor);
            },
        );
    },
);
