import assert   from 'node:assert/strict';
import { test } from 'node:test';

const { createBaseConfig, createConfig } = await import('../src/create-config.js');

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
                'root is set',
                (): void =>
                {
                    const config = createConfig();
                    assert.equal(config.root, true);
                },
            ),
            ctx.test
            (
                'top level rules are set',
                (): void =>
                {
                    const { rules } = createConfig();
                    assert(rules);
                    assert('eqeqeq' in rules);
                    assert('@fasttime/no-spaces-in-call-expression' in rules);
                },
            ),
            ctx.test
            (
                'override rules are set',
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
                                createConfig({ files: 'foobar', rules: { foobar: 'warn' } });
                                const rules = overrides?.[0]?.rules;
                                assert(rules);
                                assert.equal(rules['no-undef'], 'error');
                                assert.equal(rules.semi, 'error');
                                assert(!('@typescript-eslint/semi' in rules));
                                assert.deepEqual
                                (rules['no-redeclare'], ['error', { builtinGlobals: true }]);
                                assert(!('@typescript-eslint/no-redeclare' in rules));
                                assert.equal(rules['n/no-extraneous-import'], 'error');
                                assert.equal(rules.foobar, 'warn');
                                await allTests
                                (
                                    ctx.test
                                    (
                                        'before entry of beforeOrElse',
                                        (): void =>
                                        {
                                            const { overrides } =
                                            createConfig({ files: 'foobar', jsVersion: 2018 });
                                            const rules = overrides?.[0]?.rules;
                                            assert(rules);
                                            assert.deepEqual
                                            (
                                                rules['no-unused-vars'],
                                                [
                                                    'error',
                                                    {
                                                        ignoreRestSiblings: true,
                                                        vars: 'local',
                                                    },
                                                ],
                                            );
                                        },
                                    ),
                                    ctx.test
                                    (
                                        'else entry of beforeOrElse',
                                        (): void =>
                                        {
                                            const { overrides } =
                                            createConfig({ files: 'foobar', jsVersion: 2019 });
                                            const rules = overrides?.[0]?.rules;
                                            assert(rules);
                                            assert.deepEqual
                                            (
                                                rules['no-unused-vars'],
                                                [
                                                    'error',
                                                    {
                                                        caughtErrors: 'all',
                                                        ignoreRestSiblings: true,
                                                        vars: 'local',
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
                                        files: 'foobar',
                                        rules: { foobar: 'warn' },
                                        tsVersion: 'latest',
                                    },
                                );
                                const rules = overrides?.[0]?.rules;
                                assert(rules);
                                assert.equal(rules['no-undef'], 'off');
                                assert.equal(rules.semi, 'off');
                                assert('@typescript-eslint/semi' in rules);
                                assert.equal(rules['no-redeclare'], 'off');
                                assert('@typescript-eslint/no-redeclare' in rules);
                                assert.equal(rules['n/no-extraneous-import'], 'off');
                                assert.equal(rules.foobar, 'warn');
                                await allTests
                                (
                                    ctx.test
                                    (
                                        'before entry of beforeOrElse',
                                        (): void =>
                                        {
                                            const { overrides } =
                                            createConfig({ files: 'foobar', tsVersion: '3.7.0' });
                                            const rules = overrides?.[0]?.rules;
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
                                        'else entry of beforeOrElse',
                                        (): void =>
                                        {
                                            const { overrides } =
                                            createConfig({ files: 'foobar', tsVersion: '3.8.0' });
                                            const rules = overrides?.[0]?.rules;
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
                    );
                },
            ),
            ctx.test
            (
                'top level plugins are set',
                (): void =>
                {
                    const { plugins } = createConfig();
                    assert.deepEqual(plugins, ['@fasttime', 'n']);
                },
            ),
            ctx.test
            (
                'override plugins are set',
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
                                createConfig({ files: 'foobar', plugins: ['barbaz'] });
                                assert(overrides);
                                const [{ plugins }] = overrides;
                                assert.deepEqual(plugins, ['barbaz']);
                            },
                        ),
                        ctx.test
                        (
                            'for TypeScript',
                            (): void =>
                            {
                                const { overrides } =
                                createConfig
                                ({ files: 'foobar', plugins: ['barbaz'], tsVersion: 'latest' });
                                assert(overrides);
                                const [{ plugins }] = overrides;
                                assert.deepEqual(plugins, ['barbaz', '@typescript-eslint']);
                            },
                        ),
                    );
                },
            ),
            ctx.test
            (
                'override environment and parser are set',
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
                                const [{ env, parser, parserOptions }] = overrides;
                                assert.deepEqual(env, { es6: true });
                                assert.equal(parser, 'espree');
                                assert.deepEqual(parserOptions, { ecmaVersion: 2015 });
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
                                const [{ env, parser, parserOptions }] = overrides;
                                assert.deepEqual(env, { es2021: true });
                                assert.equal(parser, '@typescript-eslint/parser');
                                assert.deepEqual(parserOptions, { ecmaVersion: 'latest' });
                            },
                        ),
                    );
                },
            ),
            ctx.test
            (
                'override globals are set',
                (): void =>
                {
                    const { overrides } = createConfig({ files: 'foobar', globals: { '_': true } });
                    assert(overrides);
                    const [{ globals }] = overrides;
                    assert.deepEqual(globals, { '_': true });
                },
            ),
            ctx.test
            (
                'override files and excludedFiles are set',
                (): void =>
                {
                    const { overrides } = createConfig({ excludedFiles: 'foo', files: 'bar' });
                    assert(overrides);
                    const [{ excludedFiles, files }] = overrides;
                    assert.equal(excludedFiles, 'foo');
                    assert.equal(files, 'bar');
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
                'rules are set',
                (): void =>
                {
                    const { rules } = createBaseConfig({ rules: { foobar: 'warn' } });
                    assert(rules);
                    assert('eqeqeq' in rules);
                    assert('@fasttime/no-spaces-in-call-expression' in rules);
                    assert('no-undef' in rules);
                    assert('semi' in rules);
                    assert('no-redeclare' in rules);
                    assert('n/no-extraneous-import' in rules);
                    assert.equal(rules.foobar, 'warn');
                },
            ),
            ctx.test
            (
                'plugins are set',
                async (ctx): Promise<void> =>
                {
                    await allTests
                    (
                        ctx.test
                        (
                            'for JavaScript',
                            (): void =>
                            {
                                const { plugins } = createBaseConfig({ plugins: ['barbaz'] });
                                assert.deepEqual(plugins, ['@fasttime', 'n', 'barbaz']);
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
                                (plugins, ['@fasttime', 'n', 'barbaz', '@typescript-eslint']);
                            },
                        ),
                    );
                },
            ),
            ctx.test
            (
                'environment and parser are set',
                async (ctx): Promise<void> =>
                {
                    await allTests
                    (
                        ctx.test
                        (
                            'for JavaScript',
                            (): void =>
                            {
                                const { env, parser, parserOptions } =
                                createBaseConfig({ jsVersion: 2015 });
                                assert.deepEqual(env, { es6: true });
                                assert.equal(parser, 'espree');
                                assert.deepEqual(parserOptions, { ecmaVersion: 2015 });
                            },
                        ),
                        ctx.test
                        (
                            'for TypeScript',
                            (): void =>
                            {
                                const { env, parser, parserOptions } =
                                createBaseConfig({ jsVersion: 2021, tsVersion: 'latest' });
                                assert.deepEqual(env, { es2021: true });
                                assert.equal(parser, '@typescript-eslint/parser');
                                assert.deepEqual(parserOptions, { ecmaVersion: 'latest' });
                            },
                        ),
                    );
                },
            ),
            ctx.test
            (
                'globals are set',
                (): void =>
                {
                    const { globals } = createBaseConfig({ globals: { '$': true } });
                    assert.deepEqual(globals, { '$': true });
                },
            ),
        );
    },
);
