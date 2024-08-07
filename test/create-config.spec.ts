import assert           from 'node:assert/strict';
import type { Linter }  from 'eslint';
import { describe, it } from 'mocha';

const { createConfig } = await import('../src/lib/create-config.js');

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
                        '`jsVersion` and `tsVersion` cannot be specified at the same time',
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
            '`tsVersion` is not set',
            async (): Promise<void> =>
            {
                const [config] = await createConfig({ tsVersion: '4.0.0' });
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
                assert('no-undef' in rules);
                assert('dot-notation' in rules);
                assert('no-redeclare' in rules);
                assert('n/prefer-promises/fs' in rules);
                assert.equal(rules.foobar, 'warn');
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
                                const espree = await import('espree' as string) as Linter.Parser;
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
                                assert.equal(linterOptions.reportUnusedDisableDirectives, true);
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
                                        languageOptions:    { parserOptions: { project: true } },
                                        linterOptions:      { noInlineConfig: false },
                                        tsVersion:          'latest',
                                    },
                                );
                                assert(languageOptions);
                                assert.equal(languageOptions.ecmaVersion, 'latest');
                                assert.equal(languageOptions.parser, parser);
                                assert.deepEqual
                                (
                                    languageOptions.parserOptions,
                                    { project: true, projectService: true },
                                );
                                assert(linterOptions);
                                assert.equal(linterOptions.noInlineConfig, false);
                                assert.equal(linterOptions.reportUnusedDisableDirectives, true);
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
