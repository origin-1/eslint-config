import assert               from 'node:assert/strict';
import { createRequire }    from 'node:module';
import { test }             from 'node:test';
import { pathToFileURL }    from 'node:url';
import { getRulePrefix }    from '../src/rules.js';
import type { RuleType }    from '../src/rules.js';
import type { Rule }        from 'eslint';

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

const { HYBRID, RULES, UNIQUE } = await import('../src/rules.js');

void test
(
    'all built-in rules are defined',
    async (): Promise<void> =>
    {
        const builtInRules = await getBuiltInRules();
        const definedHybridRules = RULES[HYBRID];
        const definedUniqueRules = RULES[UNIQUE];
        const missingRuleNames: string[] = [];
        for (const [ruleName, ruleModule] of builtInRules)
        {
            if
            (
                !ruleModule.meta!.deprecated &&
                !Object.hasOwn(definedHybridRules, ruleName) &&
                !Object.hasOwn(definedUniqueRules, ruleName)
            )
                missingRuleNames.push(ruleName);
        }
        if (missingRuleNames.length)
        {
            assert.fail
            (
                `${missingRuleNames.length} rule(s) are not defined:\n${
                missingRuleNames.map((name): string => `\n• ${name}`).join('')}`,
            );
        }
    },
);

void test
(
    'all hybrid rules are defined',
    async (): Promise<void> =>
    {
        const builtInRules = await getBuiltInRules();
        const { default: { rules: tsRules } } = await import('@typescript-eslint/eslint-plugin');
        const definedHybridRules = RULES[HYBRID];
        const missingRuleNames: string[] = [];
        for (const [ruleName, ruleModule] of builtInRules)
        {
            if
            (
                !ruleModule.meta!.deprecated &&
                (Object.hasOwn(tsRules, ruleName) && !tsRules[ruleName].meta.deprecated) &&
                !Object.hasOwn(definedHybridRules, ruleName)
            )
                missingRuleNames.push(ruleName);
        }
        if (missingRuleNames.length)
        {
            assert.fail
            (
                `${missingRuleNames.length} rule(s) are not defined:\n${
                missingRuleNames.map((name): string => `\n• ${name}`).join('')}`,
            );
        }
    },
);

void test
(
    'all plugin rules are defined',
    async (): Promise<void> =>
    {
        const definedHybridRules = RULES[HYBRID];
        const missingRuleNames: string[] = [];
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
                        Object.hasOwn(definedHybridRules, ruleName)
                    ) &&
                    !Object.hasOwn(definedPluginRules, ruleName)
                )
                    missingRuleNames.push(`${rulePrefix}/${ruleName}`);
            }
        }
        if (missingRuleNames.length)
        {
            assert.fail
            (
                `${missingRuleNames.length} rule(s) are not defined:\n${
                missingRuleNames.map((name): string => `\n• ${name}`).join('')}`,
            );
        }
    },
);

void test
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

void test
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
            (Object.hasOwn(tsRules, ruleName), `Rule @typescript-eslint/${ruleName} not found`);
            assert
            (!tsRules[ruleName].meta.deprecated, `Rule @typescript-eslint/${ruleName} not found`);
        }
    },
);

void test
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
                    `Rule ${rulePrefix}/${ruleName} not found`,
                );
                assert
                (
                    !pluginRules[ruleName].meta!.deprecated,
                    `Rule ${rulePrefix}/${ruleName} not found`,
                );
            }
        }
    },
);

void test
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

void test
(
    'are sorted',
    async (ctx): Promise<void> =>
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

        const builtInRules = await getBuiltInRules();
        const promises =
        Reflect.ownKeys(RULES).map
        (
            async (key): Promise<void> =>
            {
                const definedRules = RULES[key];
                const testName = typeof key === 'symbol' ? key.description : `${key} plugin rules`;
                const promise =
                ctx.test
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
                return promise;
            },
        );
        await Promise.all(promises);
    },
);
