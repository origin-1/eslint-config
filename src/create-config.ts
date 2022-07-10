import { HYBRID, RULES, UNIQUE, getRulePrefix }                     from './rules.js';
import type { JSTSEntry, JSVersion, RuleSettings, VersionedList }   from './rules.js';
import type { Linter }                                              from 'eslint';
import semver                                                       from 'semver';

export interface ConfigData extends Linter.HasRules
{
    env?: Record<string, boolean> | undefined;
    globals?:
    Record<string, boolean | 'readonly' | 'readable' | 'writable' | 'writeable'> | undefined;
    jsVersion?: JSVersion | undefined;
    parserOptions?: Linter.ParserOptions | undefined;
    plugins?: string[] | undefined;
    tsVersion?: string | undefined;
}

export interface ConfigDataWithFiles extends ConfigData
{
    excludedFiles?: string | string[] | undefined;
    files: string | string[];
}

function cloneRuleEntry(ruleEntry: Linter.RuleEntry): Linter.RuleEntry
{
    return structuredClone(ruleEntry);
}

export function createBaseConfig(configData: ConfigData): Linter.BaseConfig
{
    const { plugins, rules } = createCommonEntries();
    const baseOverride = createBaseOverride(configData);
    const { env, parser, parserOptions, plugins: overridePlugins = [], rules: overrideRules } =
    baseOverride;
    plugins.push(...overridePlugins);
    Object.assign(rules, overrideRules);
    const baseConfig =
    { env, parser, parserOptions, plugins, reportUnusedDisableDirectives: true, rules };
    return baseConfig;
}

function createBaseOverride(configData: ConfigData): Linter.BaseConfig
{
    const { plugins } = configData;
    const lang = getLanguage(configData);
    let ecmaVersion: Linter.ParserOptions['ecmaVersion'];
    let envKey: string | undefined;
    let parser: string | undefined;
    const jsVersion = getJSVersion(configData);
    if (jsVersion === 2015)
        envKey = 'es6';
    else if (jsVersion > 2015)
        envKey = `es${jsVersion}`;
    const tsVersion = getTSVersion(configData);
    if (lang === 'ts')
    {
        ecmaVersion = 'latest';
        parser = '@typescript-eslint/parser';
    }
    else
    {
        ecmaVersion = jsVersion;
        parser = 'espree';
    }
    const env = envKey ? { [envKey]: true } : { };
    Object.assign(env, configData.env);
    const parserOptions = { ecmaVersion, ...configData.parserOptions };
    const rules: Record<string, Linter.RuleEntry> = { };
    const setOverrideRule =
    (ruleName: string, ruleLangSettings: VersionedList | Linter.RuleEntry | undefined): void =>
    {
        if (ruleLangSettings != null)
        {
            const ruleEntry =
            isVersionedList(ruleLangSettings) ?
            findRuleEntry(ruleLangSettings, jsVersion, tsVersion) : ruleLangSettings;
            if (ruleEntry != null)
                rules[ruleName] = cloneRuleEntry(ruleEntry);
        }
    };
    for (const [ruleName, ruleDef] of Object.entries(RULES[UNIQUE]))
    {
        if (isJSTSEntry(ruleDef))
        {
            const ruleLangSettings = ruleDef[lang];
            setOverrideRule(ruleName, ruleLangSettings);
        }
    }
    for (const [ruleName, ruleDef] of Object.entries(RULES[HYBRID]))
    {
        if (isRuleEntry(ruleDef))
        {
            if (lang === 'ts')
            {
                rules[ruleName] = 'off';
                rules[`@typescript-eslint/${ruleName}`] = cloneRuleEntry(ruleDef);
            }
            else
                rules[ruleName] = cloneRuleEntry(ruleDef);
        }
        if (isJSTSEntry(ruleDef))
        {
            if (lang === 'ts')
            {
                rules[ruleName] = 'off';
                setOverrideRule(`@typescript-eslint/${ruleName}`, ruleDef.ts);
            }
            else
                setOverrideRule(ruleName, ruleDef.js);
        }
    }
    for (const [pluginName, definedPluginRules] of Object.entries(RULES))
    {
        const rulePrefix = getRulePrefix(pluginName);
        for (const [ruleName, ruleDef] of Object.entries(definedPluginRules))
        {
            if (isJSTSEntry(ruleDef))
            {
                const ruleLangSettings = ruleDef[lang];
                setOverrideRule(`${rulePrefix}/${ruleName}`, ruleLangSettings);
            }
        }
    }
    Object.assign(rules, configData.rules);
    const baseOverride = { env, parser, parserOptions, plugins, rules };
    return baseOverride;
}

function createCommonEntries(): { plugins: string[]; rules: Record<string, Linter.RuleEntry>; }
{
    const plugins: string[] = [];
    const rules: Record<string, Linter.RuleEntry> = { };
    for (const [ruleName, ruleDef] of Object.entries(RULES[UNIQUE]))
    {
        if (isRuleEntry(ruleDef))
            rules[ruleName] = cloneRuleEntry(ruleDef);
    }
    for (const [pluginName, definedPluginRules] of Object.entries(RULES))
    {
        const rulePrefix = getRulePrefix(pluginName);
        plugins.push(rulePrefix);
        for (const [ruleName, ruleDef] of Object.entries(definedPluginRules))
        {
            if (isRuleEntry(ruleDef))
                rules[`${rulePrefix}/${ruleName}`] = cloneRuleEntry(ruleDef);
        }
    }
    const commonEntries = { plugins, rules };
    return commonEntries;
}

export function createConfig(...configDataList: ConfigDataWithFiles[]): Linter.Config
{
    const { plugins, rules } = createCommonEntries();
    const overrides = configDataList.map(createOverride);
    const config =
    {
        overrides,
        parser: '@origin-1/eslint-config/no-parser',
        plugins,
        reportUnusedDisableDirectives: true,
        root: true,
        rules,
    };
    return config;
}

function createOverride(configData: ConfigDataWithFiles): Linter.ConfigOverride
{
    const baseOverride = createBaseOverride(configData);
    const { excludedFiles, files } = configData;
    const override = { ...baseOverride, excludedFiles, files };
    return override;
}

function findRuleEntry
(versionedList: VersionedList, jsVersion: JSVersion, tsVersion: string):
Linter.RuleEntry | undefined
{
    let index = versionedList.length;
    while (index--)
    {
        const { minVersion, ruleEntry } = versionedList[index];
        switch (typeof minVersion)
        {
        case 'number':
            if (jsVersion >= minVersion)
                return ruleEntry;
            break;
        case 'string':
            if (tsVersion === 'latest' || semver.gte(tsVersion, minVersion))
                return ruleEntry;
            break;
        default:
            return ruleEntry;
        }
    }
}

function getJSVersion(configData: ConfigData): JSVersion
{
    const { jsVersion } = configData;
    return Number.isInteger(jsVersion) ? jsVersion! : 5;
}

function getLanguage(configData: ConfigData): 'js' | 'ts'
{
    return configData.tsVersion == null ? 'js' : 'ts';
}

function getTSVersion(configData: ConfigData): string
{
    const { tsVersion } = configData;
    if (tsVersion != null)
    {
        const cleanVersion = semver.clean(tsVersion);
        if (cleanVersion != null)
            return cleanVersion;
    }
    return 'latest';
}

function isJSTSEntry(ruleSettings: RuleSettings): ruleSettings is JSTSEntry
{
    return typeof ruleSettings === 'object' && 'js' in ruleSettings && 'ts' in ruleSettings;
}

function isRuleEntry(ruleSettings: RuleSettings): ruleSettings is Linter.RuleEntry
{
    return typeof ruleSettings === 'string' || Array.isArray(ruleSettings);
}

function isVersionedList
(ruleLangSettings: VersionedList | Linter.RuleEntry):
ruleLangSettings is VersionedList
{
    return Array.isArray(ruleLangSettings) && 'versioned' in ruleLangSettings;
}
