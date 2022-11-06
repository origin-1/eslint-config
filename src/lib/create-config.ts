import { normalizeJSVersion, normalizeTSVersion }                   from './normalize-version.js';
import type { JSVersion, TSVersion }                                from './normalize-version.js';
import { FOR_LANG, HYBRID, RULES, UNIQUE, getRuleKey, getRulePrefix }
from './rules.js';
import type { JSTSEntry, PluginSettingsAny, PluginSettingsForLang, RuleSettingsAny, VersionedList }
from './rules.js';
import type { Linter }                                              from 'eslint';
import semver                                                       from 'semver';

export interface ConfigData extends Linter.HasRules
{
    env?: Linter.BaseConfig['env'];
    extends?: string | string[] | undefined;
    globals?: Linter.BaseConfig['globals'];
    jsVersion?: JSVersion | undefined;
    parserOptions?: Linter.ParserOptions | undefined;
    plugins?: string[] | undefined;
    tsVersion?: TSVersion | undefined;
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
    const { env, parser, parserOptions, plugins: overridePlugins, rules: overrideRules } =
    createBaseOverride(configData);
    plugins.push(...overridePlugins);
    Object.assign(rules, overrideRules);
    const { extends: extends_, globals } = configData;
    const baseConfig =
    {
        env,
        extends:                        extends_,
        globals,
        parser,
        parserOptions,
        plugins,
        reportUnusedDisableDirectives:  true,
        rules,
    };
    return baseConfig;
}

function createBaseOverride(configData: ConfigData): Linter.BaseConfig & { plugins: string[]; }
{
    const configPlugins = configData.plugins;
    const plugins = configPlugins == null ? [] : [...configPlugins];
    const lang = getLanguage(configData);
    let ecmaVersion: Linter.ParserOptions['ecmaVersion'];
    let envKey: string | undefined;
    let parser: string | undefined;
    const jsVersion = normalizeJSVersion(configData.jsVersion);
    if (jsVersion === 2015)
        envKey = 'es6';
    else if (jsVersion > 2015)
        envKey = `es${jsVersion}`;
    const tsVersion = normalizeTSVersion(configData.tsVersion);
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
    (ruleKey: string, ruleLangSettings: VersionedList | Linter.RuleEntry): void =>
    {
        const ruleEntry =
        isVersionedList(ruleLangSettings) ?
        findRuleEntry(ruleLangSettings, jsVersion, tsVersion)! : ruleLangSettings;
        rules[ruleKey] = cloneRuleEntry(ruleEntry);
    };
    for (const [ruleName, ruleSettings] of ruleSettingsFor(RULES[UNIQUE] as PluginSettingsAny))
    {
        if (isJSTSEntry(ruleSettings))
        {
            const ruleLangSettings = ruleSettings[lang];
            setOverrideRule(ruleName, ruleLangSettings);
        }
    }
    for (const [ruleName, ruleSettings] of ruleSettingsFor(RULES[HYBRID] as PluginSettingsAny))
    {
        if (isRuleEntry(ruleSettings))
        {
            if (lang === 'ts')
            {
                rules[ruleName] = 'off';
                const typescriptESLintRuleKey = getRuleKey('@typescript-eslint', ruleName);
                rules[typescriptESLintRuleKey] = cloneRuleEntry(ruleSettings);
            }
            else
                rules[ruleName] = cloneRuleEntry(ruleSettings);
        }
        if (isJSTSEntry(ruleSettings))
        {
            if (lang === 'ts')
            {
                rules[ruleName] = 'off';
                const typescriptESLintRuleKey = getRuleKey('@typescript-eslint', ruleName);
                setOverrideRule(typescriptESLintRuleKey, ruleSettings.ts);
            }
            else
                setOverrideRule(ruleName, ruleSettings.js);
        }
    }
    for (const [pluginName, pluginSettings] of Object.entries(RULES))
    {
        if (isPluginSettingsForLang(pluginSettings))
        {
            if (lang !== pluginSettings[FOR_LANG])
                continue;
            const rulePrefix = getRulePrefix(pluginName);
            plugins.push(rulePrefix);
            for (const [ruleName, ruleSettings] of ruleSettingsFor(pluginSettings))
            {
                const ruleKey = getRuleKey(rulePrefix, ruleName);
                setOverrideRule(ruleKey, ruleSettings);
            }
        }
        else
        {
            const rulePrefix = getRulePrefix(pluginName);
            for (const [ruleName, ruleSettings] of ruleSettingsFor(pluginSettings))
            {
                if (isJSTSEntry(ruleSettings))
                {
                    const ruleKey = getRuleKey(rulePrefix, ruleName);
                    const ruleLangSettings = ruleSettings[lang];
                    setOverrideRule(ruleKey, ruleLangSettings);
                }
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
    for (const [ruleName, ruleSettings] of ruleSettingsFor(RULES[UNIQUE] as PluginSettingsAny))
    {
        if (isRuleEntry(ruleSettings))
            rules[ruleName] = cloneRuleEntry(ruleSettings);
    }
    for (const [pluginName, pluginSettings] of Object.entries(RULES))
    {
        if (isPluginSettingsForLang(pluginSettings))
            continue;
        const rulePrefix = getRulePrefix(pluginName);
        plugins.push(rulePrefix);
        for (const [ruleName, ruleSettings] of ruleSettingsFor(pluginSettings))
        {
            if (isRuleEntry(ruleSettings))
            {
                const ruleKey = getRuleKey(rulePrefix, ruleName);
                rules[ruleKey] = cloneRuleEntry(ruleSettings);
            }
        }
    }
    const commonEntries = { plugins, rules };
    return commonEntries;
}

export function createConfig(...configDataList: ConfigDataWithFiles[]): Linter.Config
{
    const { plugins, rules } = createCommonEntries();
    const overrides = configDataList.map(createOverride);
    overrides.unshift({ files: ['*.js', '*.cjs', '*.mjs', '*.ts', '*.cts', '*.mts'] });
    const config =
    {
        overrides,
        parser:                         '@origin-1/eslint-config/no-parser',
        plugins,
        reportUnusedDisableDirectives:  true,
        root:                           true,
        rules,
    };
    return config;
}

function createOverride(configData: ConfigDataWithFiles): Linter.ConfigOverride
{
    const baseOverride = createBaseOverride(configData);
    const { excludedFiles, extends: extends_, files, globals } = configData;
    const override = { ...baseOverride, excludedFiles, extends: extends_, files, globals };
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

function getLanguage(configData: ConfigData): 'js' | 'ts'
{
    return configData.tsVersion == null ? 'js' : 'ts';
}

function isJSTSEntry(ruleSettings: RuleSettingsAny): ruleSettings is JSTSEntry
{
    return typeof ruleSettings === 'object' && 'js' in ruleSettings && 'ts' in ruleSettings;
}

function isPluginSettingsForLang
(pluginSettings: PluginSettingsAny | PluginSettingsForLang):
pluginSettings is PluginSettingsForLang
{
    return FOR_LANG in pluginSettings;
}

function isRuleEntry(ruleSettings: RuleSettingsAny): ruleSettings is Linter.RuleEntry
{
    return typeof ruleSettings === 'string' || Array.isArray(ruleSettings);
}

function isVersionedList
(ruleLangSettings: VersionedList | Linter.RuleEntry):
ruleLangSettings is VersionedList
{
    return Array.isArray(ruleLangSettings) && 'versioned' in ruleLangSettings;
}

const ruleSettingsFor:
<
    PluginSettingsType extends PluginSettingsAny | PluginSettingsForLang,
    RuleSettingsType =
    PluginSettingsType extends Record<string, infer RuleSettingsType> ? RuleSettingsType : never,
>
(pluginSettings: PluginSettingsType) =>
[string, RuleSettingsType][] =
Object.entries;
