import
{
    type JSONVersion,
    type JSVersion,
    type TSVersion,
    normalizeJSONVersion,
    normalizeJSVersion,
    normalizeTSVersion,
}
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

export type ConfigData = Linter.Config & LanguageConfigData;

export interface LanguageConfigData
{
    jsVersion?:     JSVersion   | undefined;
    jsonVersion?:   JSONVersion | undefined;
    tsVersion?:     TSVersion   | undefined;
}

type SetOverrideRule =
(ruleKey: string, ruleLangSettings: VersionedList | Linter.RuleEntry) => void;

function addLanguageRules
(
    lang: 'js' | 'json' | 'ts',
    langConfig: LanguageConfigData,
    rules: Record<string, Linter.RuleEntry>,
    rulePrefixMap: Map<string, string>,
):
void
{
    const setOverrideRule = createSetOverrideRule(langConfig, rules);
    for (const [pluginName, pluginSettings] of Object.entries(RULES))
    {
        if (!isPluginSettingsForLang(pluginSettings) || lang !== pluginSettings[FOR_LANG])
            continue;
        const rulePrefix = getRulePrefix(pluginName);
        for (const [ruleName, ruleSettings] of ruleSettingsFor(pluginSettings))
        {
            rulePrefixMap.set(rulePrefix, pluginName);
            const ruleKey = getRuleKey(rulePrefix, ruleName);
            setOverrideRule(ruleKey, ruleSettings);
        }
    }
}

function cloneRuleEntry(ruleEntry: Linter.RuleEntry): Linter.RuleEntry
{
    return structuredClone(ruleEntry);
}

export async function createConfig(...configDataList: ConfigData[]): Promise<Linter.Config[]>
{
    const promises = configDataList.map(createSingleConfigObject);
    return await Promise.all(promises);
}

export { createConfig as createFlatConfig };

function createJSTSEntries
(
    lang: 'js' | 'ts',
    langConfig: LanguageConfigData,
    rules: Record<string, Linter.RuleEntry>,
    rulePrefixMap: Map<string, string>,
):
{ rulePrefixMap: Map<string, string>; rules: Record<string, Linter.RuleEntry>; }
{
    const setOverrideRule = createSetOverrideRule(langConfig, rules);
    for (const [ruleName, ruleSettings] of ruleSettingsFor(RULES[UNIQUE] as PluginSettingsAny))
    {
        if (isRuleEntry(ruleSettings))
            rules[ruleName] = cloneRuleEntry(ruleSettings);
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
            continue;
        const rulePrefix = getRulePrefix(pluginName);
        for (const [ruleName, ruleSettings] of ruleSettingsFor(pluginSettings))
        {
            rulePrefixMap.set(rulePrefix, pluginName);
            const ruleKey = getRuleKey(rulePrefix, ruleName);
            if (isRuleEntry(ruleSettings))
                rules[ruleKey] = cloneRuleEntry(ruleSettings);
            if (isJSTSEntry(ruleSettings))
            {
                const ruleLangSettings = ruleSettings[lang];
                setOverrideRule(ruleKey, ruleLangSettings);
            }
        }
    }
    return { rulePrefixMap, rules };
}

function createSetOverrideRule
(langConfig: LanguageConfigData, rules: Record<string, Linter.RuleEntry>): SetOverrideRule
{
    const setOverrideRule =
    (ruleKey: string, ruleLangSettings: VersionedList | Linter.RuleEntry): void =>
    {
        const ruleEntry =
        isVersionedList(ruleLangSettings) ?
        findRuleEntry(ruleLangSettings, langConfig)! : ruleLangSettings;
        rules[ruleKey] = cloneRuleEntry(ruleEntry);
    };
    return setOverrideRule;
}

async function createSingleConfigObject(configData: ConfigData): Promise<Linter.Config>
{
    const
    { jsonVersion: rawJSONVersion, jsVersion: rawJSVersion, tsVersion: rawTSVersion, ...config } =
    configData;
    const langCount =
    ((rawJSONVersion != null)   as unknown as number) +
    ((rawJSVersion != null)     as unknown as number) +
    ((rawTSVersion != null)     as unknown as number);
    switch (langCount)
    {
    case 0:
        break;
    case 1:
        {
            let jsVersion:      JSVersion   | undefined;
            let jsonVersion:    JSONVersion | undefined;
            let tsVersion:      TSVersion   | undefined;
            const languageOptions = { ...config.languageOptions };
            const linterOptions = { ...config.linterOptions };
            const plugins: Record<string, ESLint.Plugin> = { };
            const rules: Record<string, Linter.RuleEntry> = { };
            const rulePrefixMap: Map<string, string> = new Map<string, string>();
            const lang = getLanguage(configData)!;
            switch (lang)
            {
            case 'js':
                jsVersion = normalizeJSVersion(rawJSVersion);
                languageOptions.ecmaVersion ??= jsVersion;
                languageOptions.parser ??= await importParser('espree');
                createJSTSEntries(lang, { jsVersion }, rules, rulePrefixMap);
                break;
            case 'json':
                jsonVersion = normalizeJSONVersion(rawJSONVersion);
                void jsonVersion;
                config.language ??= 'json/json';
                break;
            case 'ts':
                tsVersion = normalizeTSVersion(rawTSVersion);
                languageOptions.ecmaVersion ??= 'latest';
                languageOptions.parser ??= await importParser('@typescript-eslint/parser');
                languageOptions.parserOptions =
                { projectService: true, ...languageOptions.parserOptions };
                createJSTSEntries(lang, { tsVersion }, rules, rulePrefixMap);
                break;
            }
            addLanguageRules(lang, { jsVersion, jsonVersion, tsVersion }, rules, rulePrefixMap);
            linterOptions.reportUnusedDisableDirectives ??= true;
            const promises: Promise<void>[] = [];
            for (const [rulePrefix, pluginName] of rulePrefixMap)
            {
                const fn =
                async (): Promise<void> =>
                {
                    const plugin = await importPlugin(pluginName);
                    plugins[rulePrefix] = plugin;
                };
                promises.push(fn());
            }
            await Promise.all(promises);
            config.languageOptions = languageOptions;
            config.linterOptions = linterOptions;
            config.plugins = Object.assign(plugins, config.plugins);
            config.rules = Object.assign(rules, config.rules);
        }
        break;
    default:
        throw TypeError
        (
            'Only one of `jsonVersion`, `jsVersion`, and `tsVersion` can be specified at the ' +
            'same time',
        );
    }
    return config;
}

function findRuleEntry
(versionedList: VersionedList, { jsVersion, jsonVersion, tsVersion }: LanguageConfigData):
Linter.RuleEntry | undefined
{
    let index = versionedList.length;
    while (index--)
    {
        const { minVersion, ruleEntry } = versionedList[index];
        if (minVersion == null)
            return ruleEntry;
        if (jsVersion != null)
        {
            if (jsVersion >= (minVersion as number))
                return ruleEntry;
        }
        else if (jsonVersion != null) /* c8 ignore next */ return ruleEntry;
        else if (tsVersion != null)
        {
            if (tsVersion === 'latest' || semver.gte(tsVersion, (minVersion as string)))
                return ruleEntry;
        }
    }
}

function getLanguage(langConfig: LanguageConfigData): 'js' | 'json' | 'ts' | undefined
{
    if (langConfig.jsVersion    != null)
        return 'js';
    if (langConfig.jsonVersion  != null)
        return 'json';
    if (langConfig.tsVersion    != null)
        return 'ts';
}

async function importParser(parserName: string): Promise<Linter.Parser>
{
    const parser = await import(parserName) as Linter.Parser;
    return parser;
}

async function importPlugin(pluginName: string): Promise<ESLint.Plugin>
{
    const { default: plugin } = await import(pluginName) as { default: ESLint.Plugin; };
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
