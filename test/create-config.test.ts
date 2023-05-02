import assert           from 'node:assert/strict';
import { test }         from 'node:test';
import type { Linter }  from 'eslint';

const { createBaseConfig, createConfig, createFlatConfig } =
await import('../src/lib/create-config.js');

export async function allTests(...promises: Promise<unknown>[]): Promise<void>
{
    await Promise.all(promises);
}

void test
(
    'createConfig',
    async (ctx): Promise<void> =>
    allTests
    (
        ctx.test
        (
            '`root` is set',
            (): void =>
            {
                const { root } = createConfig();
                assert.equal(root, true);
            },
        ),
        ctx.test
        (
            '`overrides[0]` is set',
            (): void =>
            {
                const { overrides } = createConfig();
                assert(overrides);
                assert.deepEqual
                (overrides[0], { files: ['*.js', '*.cjs', '*.mjs', '*.ts', '*.cts', '*.mts'] });
            },
        ),
        ctx.test
        (
            'top level `rules` are set',
            (): void =>
            {
                const { rules } = createConfig();
                assert(rules);
                assert('eqeqeq' in rules);
                assert('@origin-1/no-spaces-in-call-expression' in rules);
            },
        ),
        ctx.test
        (
            'override `rules` are set',
            async (ctx): Promise<void> =>
            allTests
            (
                ctx.test
                (
                    'for JavaScript',
                    async (ctx): Promise<void> =>
                    {
                        const { overrides } =
                        createConfig({ files: 'foobar', jsVersion: 5, rules: { foobar: 'warn' } });
                        const rules = overrides?.[1]?.rules;
                        assert(rules);
                        assert.deepEqual(rules['no-undef'], ['error']);
                        assert.deepEqual(rules.semi, ['error']);
                        assert(!('@typescript-eslint/semi' in rules));
                        assert.deepEqual
                        (rules['no-redeclare'], ['error', { builtinGlobals: true }]);
                        assert(!('@typescript-eslint/no-redeclare' in rules));
                        assert.equal(rules['n/prefer-promises/fs'], 'off');
                        assert.equal(rules.foobar, 'warn');
                        await allTests
                        (
                            ctx.test
                            (
                                '`before` entry of `beforeOrElse`',
                                (): void =>
                                {
                                    const { overrides } =
                                    createConfig({ files: 'foobar', jsVersion: 2018 });
                                    const rules = overrides?.[1]?.rules;
                                    assert(rules);
                                    assert.deepEqual
                                    (
                                        rules['no-unused-vars'],
                                        ['error', { ignoreRestSiblings: true, vars: 'local' }],
                                    );
                                },
                            ),
                            ctx.test
                            (
                                '`else` entry of `beforeOrElse`',
                                (): void =>
                                {
                                    const { overrides } =
                                    createConfig({ files: 'foobar', jsVersion: 2019 });
                                    const rules = overrides?.[1]?.rules;
                                    assert(rules);
                                    assert.deepEqual
                                    (
                                        rules['no-unused-vars'],
                                        [
                                            'error',
                                            {
                                                caughtErrors:       'all',
                                                ignoreRestSiblings: true,
                                                vars:               'local',
                                            },
                                        ],
                                    );
                                },
                            ),
                        );
                    },
                ),
                ctx.test
                (
                    'for TypeScript',
                    async (ctx): Promise<void> =>
                    {
                        const { overrides } =
                        createConfig
                        ({ files: 'foobar', rules: { foobar: 'warn' }, tsVersion: 'latest' });
                        const rules = overrides?.[1]?.rules;
                        assert(rules);
                        assert.equal(rules['no-undef'], 'off');
                        assert.equal(rules.semi, 'off');
                        assert('@typescript-eslint/semi' in rules);
                        assert.equal(rules['no-redeclare'], 'off');
                        assert('@typescript-eslint/no-redeclare' in rules);
                        assert.deepEqual(rules['n/prefer-promises/fs'], ['error']);
                        assert.equal(rules.foobar, 'warn');
                        await allTests
                        (
                            ctx.test
                            (
                                '`before` entry of `beforeOrElse`',
                                (): void =>
                                {
                                    const { overrides } =
                                    createConfig({ files: 'foobar', tsVersion: '3.7.0' });
                                    const rules = overrides?.[1]?.rules;
                                    assert(rules);
                                    assert.deepEqual
                                    (
                                        rules['@typescript-eslint/consistent-type-imports'],
                                        ['error', { prefer: 'no-type-imports' }],
                                    );
                                },
                            ),
                            ctx.test
                            (
                                '`else` entry of `beforeOrElse`',
                                (): void =>
                                {
                                    const { overrides } =
                                    createConfig({ files: 'foobar', tsVersion: '3.8.0' });
                                    const rules = overrides?.[1]?.rules;
                                    assert(rules);
                                    assert.deepEqual
                                    (
                                        rules['@typescript-eslint/consistent-type-imports'],
                                        ['error'],
                                    );
                                },
                            ),
                        );
                    },
                ),
                ctx.test
                (
                    'without a language',
                    (): void =>
                    {
                        const { overrides } =
                        createConfig({ files: 'foobar', rules: { foobar: 'warn' } });
                        const rules = overrides?.[1]?.rules;
                        assert.deepEqual(rules, { foobar: 'warn' });
                    },
                ),
            ),
        ),
        ctx.test
        (
            'top level `plugins` are set',
            (): void =>
            {
                const { plugins } = createConfig();
                assert.deepEqual(plugins, ['@origin-1', 'n']);
            },
        ),
        ctx.test
        (
            'override `plugins` are set',
            async (ctx): Promise<void> =>
            allTests
            (
                ctx.test
                (
                    'for JavaScript',
                    (): void =>
                    {
                        const inputPlugins = ['barbaz'];
                        const { overrides } =
                        createConfig({ files: 'foobar', jsVersion: 5, plugins: inputPlugins });
                        assert(overrides);
                        const [, { plugins: actualPlugins }] = overrides;
                        assert.notEqual(actualPlugins, inputPlugins);
                        assert.deepEqual(actualPlugins, ['barbaz']);
                        assert.deepEqual(inputPlugins, ['barbaz']);
                    },
                ),
                ctx.test
                (
                    'for TypeScript',
                    (): void =>
                    {
                        const inputPlugins = ['barbaz'];
                        const { overrides } =
                        createConfig
                        ({ files: 'foobar', plugins: inputPlugins, tsVersion: 'latest' });
                        assert(overrides);
                        const [, { plugins: actualPlugins }] = overrides;
                        assert.notEqual(actualPlugins, inputPlugins);
                        assert.deepEqual(actualPlugins, ['barbaz', '@typescript-eslint']);
                        assert.deepEqual(inputPlugins, ['barbaz']);
                    },
                ),
                ctx.test
                (
                    'without a language',
                    (): void =>
                    {
                        const inputPlugins = ['barbaz'];
                        const { overrides } =
                        createConfig({ files: 'foobar', plugins: inputPlugins });
                        assert(overrides);
                        const [, { plugins: actualPlugins }] = overrides;
                        assert.notEqual(actualPlugins, inputPlugins);
                        assert.deepEqual(actualPlugins, ['barbaz']);
                        assert.deepEqual(inputPlugins, ['barbaz']);
                    },
                ),
            ),
        ),
        ctx.test
        (
            'override `env` and `parser` are set',
            async (ctx): Promise<void> =>
            allTests
            (
                ctx.test
                (
                    'for JavaScript',
                    async (ctx): Promise<void> =>
                    allTests
                    (
                        ctx.test
                        (
                            'defaults and merging',
                            (): void =>
                            {
                                const { overrides } =
                                createConfig
                                (
                                    {
                                        env:            { node: true },
                                        files:          '*.js',
                                        jsVersion:      2015,
                                        parserOptions:  { sourceType: 'module' },
                                    },
                                );
                                assert(overrides);
                                const [, override] = overrides;
                                assert.deepEqual(override.env, { es6: true, node: true });
                                assert.equal(override.parser, 'espree');
                                assert.deepEqual
                                (
                                    override.parserOptions,
                                    { ecmaVersion: 2015, sourceType: 'module' },
                                );
                            },
                        ),
                        ctx.test
                        (
                            'overwriting',
                            (): void =>
                            {
                                const { overrides } =
                                createConfig
                                (
                                    {
                                        env:            { es6: false },
                                        files:          '*.js',
                                        jsVersion:      2015,
                                        parser:         'FOOBAR',
                                        parserOptions:  { ecmaVersion: 'latest' },
                                    },
                                );
                                assert(overrides);
                                const [, override] = overrides;
                                assert.deepEqual(override.env, { es6: false });
                                assert.equal(override.parser, 'FOOBAR');
                                assert.deepEqual(override.parserOptions, { ecmaVersion: 'latest' });
                            },
                        ),
                    ),
                ),
                ctx.test
                (
                    'for TypeScript',
                    async (ctx): Promise<void> =>
                    allTests
                    (
                        ctx.test
                        (
                            'defaults and merging',
                            (): void =>
                            {
                                const { overrides } =
                                createConfig
                                (
                                    {
                                        env:            { node: true },
                                        files:          '*.ts',
                                        jsVersion:      2021,
                                        parserOptions:  { project: 'tsconfig.json' },
                                        tsVersion:      'latest',
                                    },
                                );
                                assert(overrides);
                                const [, override] = overrides;
                                assert.deepEqual(override.env, { es2021: true, node: true });
                                assert.equal(override.parser, '@typescript-eslint/parser');
                                assert.deepEqual
                                (
                                    override.parserOptions,
                                    { ecmaVersion: 'latest', project: 'tsconfig.json' },
                                );
                            },
                        ),
                        ctx.test
                        (
                            'overwriting',
                            (): void =>
                            {
                                const { overrides } =
                                createConfig
                                (
                                    {
                                        env:            { es2021: false },
                                        files:          '*.ts',
                                        jsVersion:      2021,
                                        parser:         'FOOBAR',
                                        parserOptions:  { ecmaVersion: 2021 },
                                        tsVersion:      'latest',
                                    },
                                );
                                assert(overrides);
                                const [, override] = overrides;
                                assert.deepEqual(override.env, { es2021: false });
                                assert.equal(override.parser, 'FOOBAR');
                                assert.deepEqual(override.parserOptions, { ecmaVersion: 2021 });
                            },
                        ),
                    ),
                ),
                ctx.test
                (
                    'without a language',
                    async (ctx): Promise<void> =>
                    allTests
                    (
                        ctx.test
                        (
                            'defaults and merging',
                            (): void =>
                            {
                                const { overrides } =
                                createConfig
                                (
                                    {
                                        env:            { node: true },
                                        files:          '*',
                                        parserOptions:  { foo: 'bar' },
                                    },
                                );
                                assert(overrides);
                                const [, override] = overrides;
                                assert.deepEqual(override.env, { node: true });
                                assert(!('parser' in override));
                                assert.deepEqual
                                (override.parserOptions, { ecmaVersion: undefined, foo: 'bar' });
                            },
                        ),
                        ctx.test
                        (
                            'overwriting',
                            (): void =>
                            {
                                const { overrides } =
                                createConfig
                                (
                                    {
                                        files:          '*',
                                        parser:         'FOOBAR',
                                        parserOptions:  { ecmaVersion: 'latest' },
                                    },
                                );
                                assert(overrides);
                                const [, override] = overrides;
                                assert.deepEqual(override.env, { });
                                assert.equal(override.parser, 'FOOBAR');
                                assert.deepEqual(override.parserOptions, { ecmaVersion: 'latest' });
                            },
                        ),
                    ),
                ),
            ),
        ),
        ctx.test
        (
            'override `extends`, `globals` and `processor` are set',
            (): void =>
            {
                const extends_ = ['foo', 'bar'];
                const globals = { '_': true };
                const processor = 'barfoo';
                const { overrides } =
                createConfig({ files: 'foobar', extends: extends_, globals, processor });
                assert(overrides);
                const [, override] = overrides;
                assert.equal(override.extends,      extends_);
                assert.equal(override.globals,      globals);
                assert.equal(override.processor,    processor);
            },
        ),
        ctx.test
        (
            'override `files` and `excludedFiles` are set',
            (): void =>
            {
                const { overrides } = createConfig({ excludedFiles: 'foo', files: 'bar' });
                assert(overrides);
                const [, override] = overrides;
                assert.equal(override.excludedFiles, 'foo');
                assert.equal(override.files, 'bar');
            },
        ),
    ),
);

void test
(
    'createBaseConfig',
    async (ctx): Promise<void> =>
    allTests
    (
        ctx.test
        (
            '`rules` are set',
            (): void =>
            {
                const { rules } = createBaseConfig({ jsVersion: 5, rules: { foobar: 'warn' } });
                assert(rules);
                assert('eqeqeq' in rules);
                assert('@origin-1/no-spaces-in-call-expression' in rules);
                assert('no-undef' in rules);
                assert('semi' in rules);
                assert('no-redeclare' in rules);
                assert('n/prefer-promises/fs' in rules);
                assert.equal(rules.foobar, 'warn');
            },
        ),
        ctx.test
        (
            '`plugins` are set',
            async (ctx): Promise<void> =>
            allTests
            (
                ctx.test
                (
                    'for JavaScript',
                    (): void =>
                    {
                        const { plugins } = createBaseConfig({ jsVersion: 5, plugins: ['barbaz'] });
                        assert.deepEqual(plugins, ['@origin-1', 'n', 'barbaz']);
                    },
                ),
                ctx.test
                (
                    'for TypeScript',
                    (): void =>
                    {
                        const { plugins } =
                        createBaseConfig({ plugins: ['barbaz'], tsVersion: 'latest' });
                        assert.deepEqual
                        (plugins, ['@origin-1', 'n', 'barbaz', '@typescript-eslint']);
                    },
                ),
                ctx.test
                (
                    'without a language',
                    (): void =>
                    {
                        const { plugins } = createBaseConfig({ plugins: ['barbaz'] });
                        assert.deepEqual(plugins, ['barbaz']);
                    },
                ),
            ),
        ),
        ctx.test
        (
            '`env` and `parser` are set',
            async (ctx): Promise<void> =>
            allTests
            (
                ctx.test
                (
                    'for JavaScript',
                    async (ctx): Promise<void> =>
                    allTests
                    (
                        ctx.test
                        (
                            'defaults and merging',
                            (): void =>
                            {
                                const baseConfig =
                                createBaseConfig
                                (
                                    {
                                        env:            { node: true },
                                        jsVersion:      2015,
                                        parserOptions:  { sourceType: 'module' },
                                    },
                                );
                                assert.deepEqual(baseConfig.env, { es6: true, node: true });
                                assert.equal(baseConfig.parser, 'espree');
                                assert.deepEqual
                                (
                                    baseConfig.parserOptions,
                                    { ecmaVersion: 2015, sourceType: 'module' },
                                );
                            },
                        ),
                        ctx.test
                        (
                            'overwriting',
                            (): void =>
                            {
                                const baseConfig =
                                createBaseConfig
                                (
                                    {
                                        env:            { es6: false },
                                        jsVersion:      2015,
                                        parser:         'FOOBAR',
                                        parserOptions:  { ecmaVersion: 'latest' },
                                    },
                                );
                                assert.deepEqual(baseConfig.env, { es6: false });
                                assert.equal(baseConfig.parser, 'FOOBAR');
                                assert.deepEqual
                                (baseConfig.parserOptions, { ecmaVersion: 'latest' });
                            },
                        ),
                    ),
                ),
                ctx.test
                (
                    'for TypeScript',
                    async (ctx): Promise<void> =>
                    allTests
                    (
                        ctx.test
                        (
                            'defaults and merging',
                            (): void =>
                            {
                                const baseConfig =
                                createBaseConfig
                                (
                                    {
                                        env:            { node: true },
                                        jsVersion:      2021,
                                        parserOptions:  { project: 'tsconfig.json' },
                                        tsVersion:      'latest',
                                    },
                                );
                                assert.deepEqual(baseConfig.env, { es2021: true, node: true });
                                assert.equal(baseConfig.parser, '@typescript-eslint/parser');
                                assert.deepEqual
                                (
                                    baseConfig.parserOptions,
                                    { ecmaVersion: 'latest', project: 'tsconfig.json' },
                                );
                            },
                        ),
                        ctx.test
                        (
                            'overwriting',
                            (): void =>
                            {
                                const baseConfig =
                                createBaseConfig
                                (
                                    {
                                        env:            { es2021: false },
                                        jsVersion:      2021,
                                        parser:         'FOOBAR',
                                        parserOptions:  { ecmaVersion: 2021 },
                                        tsVersion:      'latest',
                                    },
                                );
                                assert.deepEqual(baseConfig.env, { es2021: false });
                                assert.equal(baseConfig.parser, 'FOOBAR');
                                assert.deepEqual(baseConfig.parserOptions, { ecmaVersion: 2021 });
                            },
                        ),
                    ),
                ),
                ctx.test
                (
                    'without a language',
                    async (ctx): Promise<void> =>
                    allTests
                    (
                        ctx.test
                        (
                            'defaults and merging',
                            (): void =>
                            {
                                const baseConfig =
                                createBaseConfig
                                ({ env: { node: true }, parserOptions: { foo: 'bar' } });
                                assert.deepEqual(baseConfig.env, { node: true });
                                assert(!('parser' in baseConfig));
                                assert.deepEqual
                                (baseConfig.parserOptions, { ecmaVersion: undefined, foo: 'bar' });
                            },
                        ),
                        ctx.test
                        (
                            'overwriting',
                            (): void =>
                            {
                                const baseConfig =
                                createBaseConfig
                                ({ parser: 'FOOBAR', parserOptions: { ecmaVersion: 'latest' } });
                                assert.deepEqual(baseConfig.env, { });
                                assert.equal(baseConfig.parser, 'FOOBAR');
                                assert.deepEqual
                                (baseConfig.parserOptions, { ecmaVersion: 'latest' });
                            },
                        ),
                    ),
                ),
            ),
        ),
        ctx.test
        (
            '`extends`, `globals` and `processor` are set',
            (): void =>
            {
                const extends_ = ['foo', 'bar'];
                const globals = { '$': true };
                const processor = 'barfoo';
                const baseConfig = createBaseConfig({ extends: extends_, globals, processor });
                assert.equal(baseConfig.extends,    extends_);
                assert.equal(baseConfig.globals,    globals);
                assert.equal(baseConfig.processor,  processor);
            },
        ),
    ),
);

void test
(
    'createFlatConfig',
    async (ctx): Promise<void> =>
    allTests
    (
        ctx.test
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
                await createFlatConfig
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
        ),
        ctx.test
        (
            'with both `jsVersion` and `tsVersion specified`',
            async (): Promise<void> =>
            {
                await assert.rejects
                (
                    async (): Promise<unknown> =>
                    createFlatConfig({ jsVersion: 5, tsVersion: 'latest' }),
                    {
                        constructor: TypeError,
                        message:
                        '`jsVersion` and `tsVersion` cannot be specified at the same time',
                    },
                );
            },
        ),
        ctx.test
        (
            '`files` and `ignores` are set',
            async (): Promise<void> =>
            {
                const files = ['foo', 'bar'];
                const ignores = ['baz'];
                const [config] = await createFlatConfig({ files, ignores });
                assert.equal(config.files, files);
                assert.equal(config.ignores, ignores);
                assert(!('languageOptions' in config));
                assert(!('parser' in config));
                assert(!('rules' in config));
            },
        ),
        ctx.test
        (
            '`jsVersion` is not set',
            async (): Promise<void> =>
            {
                const [config] = await createFlatConfig({ jsVersion: 5 });
                assert(!('jsVersion' in config));
            },
        ),
        ctx.test
        (
            '`tsVersion` is not set',
            async (): Promise<void> =>
            {
                const [config] = await createFlatConfig({ tsVersion: '4.0.0' });
                assert(!('tsVersion' in config));
            },
        ),
        ctx.test
        (
            '`rules` are set',
            async (): Promise<void> =>
            {
                const [{ rules }] =
                await createFlatConfig({ jsVersion: 5, rules: { foobar: 'warn' } });
                assert(rules);
                assert('eqeqeq' in rules);
                assert('@origin-1/no-spaces-in-call-expression' in rules);
                assert('no-undef' in rules);
                assert('semi' in rules);
                assert('no-redeclare' in rules);
                assert('n/prefer-promises/fs' in rules);
                assert.equal(rules.foobar, 'warn');
            },
        ),
        ctx.test
        (
            '`plugins` are set',
            async (ctx): Promise<void> =>
            allTests
            (
                ctx.test
                (
                    'for JavaScript',
                    async (): Promise<void> =>
                    {
                        const [{ plugins }] =
                        await createFlatConfig({ jsVersion: 5, plugins: { barbaz: { } } });
                        assert(plugins);
                        assert.deepEqual(Object.keys(plugins), ['@origin-1', 'n', 'barbaz']);
                    },
                ),
                ctx.test
                (
                    'for TypeScript',
                    async (): Promise<void> =>
                    {
                        const [{ plugins }] =
                        await createFlatConfig({ plugins: { barbaz: { } }, tsVersion: 'latest' });
                        assert(plugins);
                        assert.deepEqual
                        (Object.keys(plugins), ['@origin-1', 'n', '@typescript-eslint', 'barbaz']);
                    },
                ),
            ),
        ),
        ctx.test
        (
            '`languageOptions` and `linterOptions` are set',
            async (ctx): Promise<void> =>
            allTests
            (
                ctx.test
                (
                    'for JavaScript',
                    async (ctx): Promise<void> =>
                    allTests
                    (
                        ctx.test
                        (
                            'defaults and merging',
                            async (): Promise<void> =>
                            {
                                const espree =
                                await import('espree' as string) as Linter.ParserModule;
                                const [{ languageOptions, linterOptions }] =
                                await createFlatConfig
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
                        ),
                        ctx.test
                        (
                            'overwriting',
                            async (): Promise<void> =>
                            {
                                const parser = { } as Linter.ParserModule;
                                const [{ languageOptions, linterOptions }] =
                                await createFlatConfig
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
                        ),
                    ),
                ),
                ctx.test
                (
                    'for TypeScript',
                    async (ctx): Promise<void> =>
                    allTests
                    (
                        ctx.test
                        (
                            'defaults and merging',
                            async (): Promise<void> =>
                            {
                                const parser = await import('@typescript-eslint/parser');
                                const parserOptions = { project: 'tsconfig.json' };
                                const [{ languageOptions, linterOptions }] =
                                await createFlatConfig
                                (
                                    {
                                        languageOptions:    { parserOptions },
                                        linterOptions:      { noInlineConfig: false },
                                        tsVersion:          'latest',
                                    },
                                );
                                assert(languageOptions);
                                assert.equal(languageOptions.ecmaVersion, 'latest');
                                assert.equal(languageOptions.parser, parser);
                                assert.equal(languageOptions.parserOptions, parserOptions);
                                assert(linterOptions);
                                assert.equal(linterOptions.noInlineConfig, false);
                                assert.equal(linterOptions.reportUnusedDisableDirectives, true);
                            },
                        ),
                        ctx.test
                        (
                            'overwriting',
                            async (): Promise<void> =>
                            {
                                const parser = await import('@typescript-eslint/parser');
                                const [{ languageOptions, linterOptions }] =
                                await createFlatConfig
                                (
                                    {
                                        languageOptions:    { ecmaVersion: 2019 },
                                        linterOptions:
                                        { reportUnusedDisableDirectives: false },
                                        tsVersion:          'latest',
                                    },
                                );
                                assert(languageOptions);
                                assert.equal(languageOptions.ecmaVersion, 2019);
                                assert.equal(languageOptions.parser, parser);
                                assert(linterOptions);
                                assert.equal(linterOptions.reportUnusedDisableDirectives, false);
                            },
                        ),
                    ),
                ),
            ),
        ),
        ctx.test
        (
            '`globals` and `processor` are set',
            async (): Promise<void> =>
            {
                const globals = { '$': true };
                const processor = 'barfoo';
                const [config] =
                await createFlatConfig({ languageOptions: { globals }, processor });
                assert.equal(config.languageOptions?.globals, globals);
                assert.equal(config.processor,  processor);
            },
        ),
    ),
);
