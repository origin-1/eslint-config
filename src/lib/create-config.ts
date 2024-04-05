import { type JSVersion, type TSVersion, normalizeJSVersion, normalizeTSVersion }
from './normalize-version.js';
import
{
    FOR_LANG,
    HYBRID,
    type JSTSEntry,
    type PluginSettingsAny,
    type PluginSettingsForLang,
    RULES,
    type RuleSettingsAny,
    UNIQUE,
    type VersionedList,
    getRuleKey,
    getRulePrefix,
}
from './rules.js';
import type { ESLint, Linter }  from 'eslint';
import semver                   from 'semver';

export type ConfigData = Linter.FlatConfig & LanguageConfigData;

export interface LanguageConfigData
{
    jsVersion?: JSVersion | undefined;
    tsVersion?: TSVersion | undefined;
}

function addLanguageRules
(
    lang: 'js' | 'ts',
    jsVersion: JSVersion | undefined,
    tsVersion: TSVersion | undefined,
    rules: Record<string, Linter.RuleEntry>,
    rulePrefixes: string[],
):
void
{
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
            rulePrefixes.push(rulePrefix);
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
}

function cloneRuleEntry(ruleEntry: Linter.RuleEntry): Linter.RuleEntry
{
    return structuredClone(ruleEntry);
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

export async function createConfig(...configDataList: ConfigData[]): Promise<Linter.FlatConfig[]>
{
    const promises = configDataList.map(createSingleFlatConfig);
    return Promise.all(promises);
}

export { createConfig as createFlatConfig };

async function createSingleFlatConfig(configData: ConfigData): Promise<Linter.FlatConfig>
{
    const { jsVersion: rawJSVersion, tsVersion: rawTSVersion, ...config } = configData;
    if (rawJSVersion != null && rawTSVersion != null)
        throw TypeError('`jsVersion` and `tsVersion` cannot be specified at the same time');
    const lang = getLanguage(configData);
    if (lang != null)
    {
        const languageOptions = { ...config.languageOptions };
        let { ecmaVersion, parser } = languageOptions;
        let jsVersion: JSVersion | undefined;
        let tsVersion: TSVersion | undefined;
        switch (lang)
        {
        case 'js':
            jsVersion = normalizeJSVersion(rawJSVersion);
            ecmaVersion ??= jsVersion;
            parser ??= await importParser('espree');
            break;
        case 'ts':
            tsVersion = normalizeTSVersion(rawTSVersion);
            ecmaVersion ??= 'latest';
            parser ??= await importParser('@typescript-eslint/parser');
            break;
        }
        languageOptions.ecmaVersion = ecmaVersion;
        languageOptions.parser = parser;
        const linterOptions = { ...config.linterOptions };
        linterOptions.reportUnusedDisableDirectives ??= true;
        const plugins: Record<string, ESLint.Plugin> = { };
        const { plugins: rulePrefixes, rules } = createCommonEntries();
        addLanguageRules(lang, jsVersion, tsVersion, rules, rulePrefixes);
        const pluginPromises = rulePrefixes.map(importPlugin);
        const pluginList = await Promise.all(pluginPromises);
        rulePrefixes.forEach
        (
            (rulePrefix, index): void =>
            {
                plugins[rulePrefix] = pluginList[index];
            },
        );
        config.languageOptions = languageOptions;
        config.linterOptions = linterOptions;
        config.plugins =  Object.assign(plugins, config.plugins);
        config.rules = Object.assign(rules, config.rules);
    }
    return config;
}

function findRuleEntry
(versionedList: VersionedList, jsVersion: JSVersion | undefined, tsVersion: TSVersion | undefined):
Linter.RuleEntry | undefined
{
    let index = versionedList.length;
    while (index--)
    {
        const { minVersion, ruleEntry } = versionedList[index];
        switch (typeof minVersion)
        {
        case 'number':
            if (jsVersion != null && jsVersion >= minVersion)
                return ruleEntry;
            break;
        case 'string':
            if (tsVersion != null && (tsVersion === 'latest' || semver.gte(tsVersion, minVersion)))
                return ruleEntry;
            break;
        default:
            return ruleEntry;
        }
    }
}

function getLanguage(configData: LanguageConfigData): 'js' | 'ts' | undefined
{
    if (configData.tsVersion != null)
        return 'ts';
    if (configData.jsVersion != null)
        return 'js';
}

async function importParser(parserName: string): Promise<Linter.ParserModule>
{
    const parser = await import(parserName) as Linter.ParserModule;
    return parser;
}

async function importPlugin(pluginName: string): Promise<ESLint.Plugin>
{
    let pkgName: string;
    const match = /^(?<scope>@.*?\/|)(?<name>[^@].*)$/.exec(pluginName);
    if (match)
    {
        const { scope, name } = match.groups!;
        pkgName = `${scope}eslint-plugin-${name}`;
    }
    else
        pkgName = `${pluginName}/eslint-plugin`;
    const { default: plugin } = await import(pkgName) as { default: ESLint.Plugin; };
    return plugin;
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
