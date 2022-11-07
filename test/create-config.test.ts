import assert   from 'node:assert/strict';
import { test } from 'node:test';

const { createBaseConfig, createConfig } = await import('../src/lib/create-config.js');

export async function allTests(...promises: Promise<unknown>[]): Promise<unknown>
{
    return Promise.all(promises);
}

void test
(
    'createConfig',
    async (ctx): Promise<void> =>
    {
        await allTests
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
                {
                    await allTests
                    (
                        ctx.test
                        (
                            'for JavaScript',
                            async (ctx): Promise<void> =>
                            {
                                const { overrides } =
                                createConfig
                                ({ files: 'foobar', jsVersion: 5, rules: { foobar: 'warn' } });
                                const rules = overrides?.[1]?.rules;
                                assert(rules);
                                assert.equal(rules['no-undef'], 'error');
                                assert.equal(rules.semi, 'error');
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
                                                [
                                                    'error',
                                                    { ignoreRestSiblings: true, vars: 'local' },
                                                ],
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
                                (
                                    {
                                        files:      'foobar',
                                        rules:      { foobar: 'warn' },
                                        tsVersion:  'latest',
                                    },
                                );
                                const rules = overrides?.[1]?.rules;
                                assert(rules);
                                assert.equal(rules['no-undef'], 'off');
                                assert.equal(rules.semi, 'off');
                                assert('@typescript-eslint/semi' in rules);
                                assert.equal(rules['no-redeclare'], 'off');
                                assert('@typescript-eslint/no-redeclare' in rules);
                                assert.equal(rules['n/prefer-promises/fs'], 'error');
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
                                            assert.equal
                                            (
                                                rules['@typescript-eslint/consistent-type-imports'],
                                                'error',
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
                    );
                },
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
                {
                    await allTests
                    (
                        ctx.test
                        (
                            'for JavaScript',
                            (): void =>
                            {
                                const inputPlugins = ['barbaz'];
                                const { overrides } =
                                createConfig
                                ({ files: 'foobar', jsVersion: 5, plugins: inputPlugins });
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
                    );
                },
            ),
            ctx.test
            (
                'override `env` and `parser` are set',
                async (ctx): Promise<void> =>
                {
                    await allTests
                    (
                        ctx.test
                        (
                            'for JavaScript',
                            (): void =>
                            {
                                const { overrides } =
                                createConfig({ files: 'foobar', jsVersion: 2015 });
                                assert(overrides);
                                const [, override] = overrides;
                                assert.deepEqual(override.env, { es6: true });
                                assert.equal(override.parser, 'espree');
                                assert.deepEqual(override.parserOptions, { ecmaVersion: 2015 });
                            },
                        ),
                        ctx.test
                        (
                            'for TypeScript',
                            (): void =>
                            {
                                const { overrides } =
                                createConfig
                                ({ files: 'foobar', jsVersion: 2021, tsVersion: 'latest' });
                                assert(overrides);
                                const [, override] = overrides;
                                assert.deepEqual(override.env, { es2021: true });
                                assert.equal(override.parser, '@typescript-eslint/parser');
                                assert.deepEqual(override.parserOptions, { ecmaVersion: 'latest' });
                            },
                        ),
                        ctx.test
                        (
                            'without a language',
                            (): void =>
                            {
                                const { overrides } = createConfig({ files: 'foobar' });
                                assert(overrides);
                                const [, override] = overrides;
                                assert.deepEqual(override.env, { });
                                assert(!('parser' in override));
                                assert.deepEqual
                                (override.parserOptions, { ecmaVersion: undefined });
                            },
                        ),
                    );
                },
            ),
            ctx.test
            (
                'override `extends` and `globals` are set',
                (): void =>
                {
                    const extends_ = ['foo', 'bar'];
                    const globals = { '_': true };
                    const { overrides } =
                    createConfig({ files: 'foobar', extends: extends_, globals });
                    assert(overrides);
                    const [, override] = overrides;
                    assert.equal(override.extends, extends_);
                    assert.equal(override.globals, globals);
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
        );
    },
);

void test
(
    'createBaseConfig',
    async (ctx): Promise<void> =>
    {
        await allTests
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
                {
                    await allTests
                    (
                        ctx.test
                        (
                            'for JavaScript',
                            (): void =>
                            {
                                const { plugins } =
                                createBaseConfig({ jsVersion: 5, plugins: ['barbaz'] });
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
                    );
                },
            ),
            ctx.test
            (
                '`env` and `parser` are set',
                async (ctx): Promise<void> =>
                {
                    await allTests
                    (
                        ctx.test
                        (
                            'for JavaScript',
                            (): void =>
                            {
                                const baseConfig = createBaseConfig({ jsVersion: 2015 });
                                assert.deepEqual(baseConfig.env, { es6: true });
                                assert.equal(baseConfig.parser, 'espree');
                                assert.deepEqual(baseConfig.parserOptions, { ecmaVersion: 2015 });
                            },
                        ),
                        ctx.test
                        (
                            'for TypeScript',
                            (): void =>
                            {
                                const baseConfig =
                                createBaseConfig({ jsVersion: 2021, tsVersion: 'latest' });
                                assert.deepEqual(baseConfig.env, { es2021: true });
                                assert.equal(baseConfig.parser, '@typescript-eslint/parser');
                                assert.deepEqual
                                (baseConfig.parserOptions, { ecmaVersion: 'latest' });
                            },
                        ),
                        ctx.test
                        (
                            'without a language',
                            (): void =>
                            {
                                const baseConfig = createBaseConfig({ });
                                assert.deepEqual(baseConfig.env, { });
                                assert(!('parser' in baseConfig));
                                assert.deepEqual
                                (baseConfig.parserOptions, { ecmaVersion: undefined });
                            },
                        ),
                    );
                },
            ),
            ctx.test
            (
                '`extends` and `globals` are set',
                (): void =>
                {
                    const extends_ = ['foo', 'bar'];
                    const globals = { '$': true };
                    const baseConfig = createBaseConfig({ extends: extends_, globals });
                    assert.equal(baseConfig.extends, extends_);
                    assert.equal(baseConfig.globals, globals);
                },
            ),
        );
    },
);
