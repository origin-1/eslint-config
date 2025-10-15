import { inspect }  from 'node:util';
import semver       from 'semver';

const JS_VERSION_SET =
new Set([5, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026] as const);

export type JSONVersion = 'standard';

export type JSVersion = typeof JS_VERSION_SET extends Set<infer T> ? T : never;

export type TSVersion =
'latest' | `${number}.${number}.${number}` | `${number}.${number}.${number}-${string}`;

export function normalizeJSONVersion(jsonVersion: unknown = 'standard'): JSONVersion
{
    if (jsonVersion === 'standard')
        return jsonVersion;
    const message =
    `jsonVersion ${inspect(jsonVersion)} is not supported. Only 'standard' is supported`;
    throw TypeError(message);
}

export function normalizeJSVersion(jsVersion: unknown = 5): JSVersion
{
    if (JS_VERSION_SET.has(jsVersion as JSVersion))
        return jsVersion as JSVersion;
    const validValuesList = new Intl.ListFormat('en').format([...JS_VERSION_SET].map(String));
    const message =
    `jsVersion ${inspect(jsVersion)} is not supported. Valid values are ${validValuesList}`;
    throw TypeError(message);
}

export function normalizeTSVersion(tsVersion: unknown = 'latest'): TSVersion
{
    if (tsVersion === 'latest')
        return tsVersion;
    const normalTSVersion = semver.clean(tsVersion as string) as TSVersion | null;
    if (normalTSVersion != null)
        return normalTSVersion;
    const message = `tsVersion ${inspect(tsVersion)} is not supported`;
    throw TypeError(message);
}
