import assert               from 'node:assert/strict';
import { createRequire }    from 'node:module';
import { pathToFileURL }    from 'node:url';
import type { RuleType }    from '../src/lib/rules.js';
import type { Rule }        from 'eslint';
import { describe, it }     from 'mocha';

const { AssertionError } = assert;

function assertNoRulesMissing(missingRules: readonly string[]): void
{
    if (missingRules.length)
    {
        const message =
        `${missingRules.length} rule(s) are not defined:\n${
        missingRules.map((name): string => `\n* ${name}`).join('')}`;
        throw new AssertionError({ message, stackStartFn: assertNoRulesMissing });
    }
}

async function getBuiltInRules(): Promise<Map<string, Rule.RuleModule>>
{
    const require = createRequire(import.meta.url);
    const pkgMain = require.resolve('eslint/package.json');
    const pkgMainURL = pathToFileURL(pkgMain);
    const rulesDirURL = new URL('lib/rules/index.js', pkgMainURL).toString();
    const { default: builtInRules } =
    await import(rulesDirURL) as { default: Map<string, Rule.RuleModule>; };
    return builtInRules;
}

async function getPluginRules(pluginName: string): Promise<Record<string, Rule.RuleModule>>
{
    const { default: { rules } } =
    await import(pluginName) as { default: { rules: Record<string, Rule.RuleModule>; }; };
    return rules;
}

const { HYBRID, RULES, UNIQUE, getRuleKey, getRulePrefix } = await import('../src/lib/rules.js');

it
(
    'all built-in rules are defined',
    async (): Promise<void> =>
    {
        const builtInRules = await getBuiltInRules();
        const definedHybridRules = RULES[HYBRID];
        const definedUniqueRules = RULES[UNIQUE];
        const missingRules: string[] = [];
        for (const [ruleName, ruleModule] of builtInRules)
        {
            if
            (
                !ruleModule.meta!.deprecated &&
                !Object.hasOwn(definedHybridRules, ruleName) &&
                !Object.hasOwn(definedUniqueRules, ruleName)
            )
                missingRules.push(ruleName);
        }
        assertNoRulesMissing(missingRules);
    },
);

it
(
    'all plugin rules are defined',
    async (): Promise<void> =>
    {
        const definedHybridRules = RULES[HYBRID];
        const definedUniqueRules = RULES[UNIQUE];
        const missingRules: string[] = [];
        for (const [pluginName, definedPluginRules] of Object.entries(RULES))
        {
            const rulePrefix = getRulePrefix(pluginName);
            const pluginRules = await getPluginRules(pluginName);
            for (const [ruleName, ruleModule] of Object.entries(pluginRules))
            {
                if
                (
                    !ruleModule.meta!.deprecated &&
                    !(
                        pluginName === '@typescript-eslint/eslint-plugin' &&
                        (
                            Object.hasOwn(definedHybridRules, ruleName) ||
                            Object.hasOwn(definedUniqueRules, ruleName)
                        )
                    ) &&
                    !Object.hasOwn(definedPluginRules, ruleName)
                )
                {
                    const ruleKey = getRuleKey(rulePrefix, ruleName);
                    missingRules.push(ruleKey);
                }
            }
        }
        assertNoRulesMissing(missingRules);
    },
);

it
(
    'unique rules exist',
    async (): Promise<void> =>
    {
        const builtInRules = await getBuiltInRules();
        for (const ruleName of Object.keys(RULES[UNIQUE]))
        {
            assert(builtInRules.has(ruleName), `Rule ${ruleName} not found`);
            assert(!builtInRules.get(ruleName)!.meta!.deprecated, `Rule ${ruleName} is deprecated`);
        }
    },
);

it
(
    'hybrid rules exist',
    async (): Promise<void> =>
    {
        const builtInRules = await getBuiltInRules();
        const { default: { rules: tsRules } } = await import('@typescript-eslint/eslint-plugin');
        for (const ruleName of Object.keys(RULES[HYBRID]))
        {
            assert(builtInRules.has(ruleName), `Rule ${ruleName} not found`);
            assert(!builtInRules.get(ruleName)!.meta!.deprecated, `Rule ${ruleName} is deprecated`);
            assert
            (
                Object.hasOwn(tsRules, ruleName),
                `Rule ${getRuleKey('@typescript-eslint', ruleName)} not found`,
            );
            assert
            (
                !tsRules[ruleName].meta.deprecated,
                `Rule ${getRuleKey('@typescript-eslint', ruleName)} is deprecated`,
            );
        }
    },
);

it
(
    'plugin rules exist',
    async (): Promise<void> =>
    {
        for (const pluginName of Object.keys(RULES))
        {
            const rulePrefix = getRulePrefix(pluginName);
            const pluginRules = await getPluginRules(pluginName);
            for (const ruleName of Object.keys(RULES[pluginName]))
            {
                assert
                (
                    Object.hasOwn(pluginRules, ruleName),
                    `Rule ${getRuleKey(rulePrefix, ruleName)} not found`,
                );
                assert
                (
                    !pluginRules[ruleName].meta!.deprecated,
                    `Rule ${getRuleKey(rulePrefix, ruleName)} is deprecated`,
                );
            }
        }
    },
);

it
(
    'hybrid rules are not duplicated',
    (): void =>
    {
        const definedUniqueRules            = RULES[UNIQUE];
        const definedTypescriptESLintRules  = RULES['@typescript-eslint/eslint-plugin'];
        for (const ruleName of Object.keys(RULES[HYBRID]))
        {
            assert
            (
                !Object.hasOwn(definedUniqueRules, ruleName),
                `Rule ${ruleName} is duplicated`,
            );
            assert
            (
                !Object.hasOwn(definedTypescriptESLintRules, ruleName),
                `Rule ${ruleName} is duplicated`,
            );
        }
    },
);

describe
(
    'are sorted',
    (): void =>
    {
        function compareRules
        (ruleNameA: string, ruleTypeA: RuleType, ruleNameB: string, ruleTypeB: RuleType):
        number
        {
            const cmp = ruleTypeOrder(ruleTypeA) - ruleTypeOrder(ruleTypeB);
            if (cmp)
                return cmp;
            return ruleNameA.localeCompare(ruleNameB);
        }

        async function getRuleType(key: string | symbol, ruleName: string): Promise<RuleType>
        {
            let ruleType: RuleType;
            if (typeof key === 'symbol')
                ruleType = builtInRules.get(ruleName)!.meta!.type!;
            else
            {
                const pluginName = key;
                const pluginRules = await getPluginRules(pluginName);
                ruleType = pluginRules[ruleName].meta!.type!;
            }
            return ruleType;
        }

        function ruleTypeOrder(ruleType: RuleType): number
        {
            switch (ruleType)
            {
            case 'problem':
                return 1;
            case 'suggestion':
                return 2;
            case 'layout':
                return 3;
            }
        }

        let builtInRules: Map<string, Rule.RuleModule>;
        before
        (
            async (): Promise<void> =>
            {
                builtInRules = await getBuiltInRules();
            },
        );
        Reflect.ownKeys(RULES).forEach
        (
            (key): void =>
            {
                const definedRules = RULES[key];
                const testName = typeof key === 'symbol' ? key.description! : `${key} plugin rules`;
                it
                (
                    testName,
                    async (): Promise<void> =>
                    {
                        let lastRuleName: string | undefined;
                        let lastRuleType: RuleType | undefined;
                        for (const ruleName of Object.keys(definedRules))
                        {
                            const ruleType = await getRuleType(key, ruleName);
                            if (lastRuleName != null && lastRuleType != null)
                            {
                                const cmp =
                                compareRules(lastRuleName, lastRuleType, ruleName, ruleType);
                                if (cmp > 0)
                                {
                                    assert.fail
                                    (`Rules ${lastRuleName} and ${ruleName} are not sorted`);
                                }
                            }
                            lastRuleName = ruleName;
                            lastRuleType = ruleType;
                        }
                    },
                );
            },
        );
    },
);
