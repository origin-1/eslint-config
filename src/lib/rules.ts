import type { JSVersion, TSVersion }    from './normalize-version.js';
import type { Linter }                  from 'eslint';

export interface JSTSEntry
{
    js: RuleSettingsJS;
    ts: RuleSettingsTS;
}

export const FOR_LANG: unique symbol = Symbol('For one language only');

export type PluginSettingsAny       = Record<string, RuleSettingsAny>;
export type PluginSettingsForLang   =
(Record<string, RuleSettingsJS> & { [FOR_LANG]: 'js'; }) |
(Record<string, RuleSettingsTS> & { [FOR_LANG]: 'ts'; });

export type RuleSettingsAny = Linter.RuleEntry | JSTSEntry;
export type RuleSettingsJS  = VersionedList<JSVersion> | Linter.RuleEntry;
export type RuleSettingsTS  = VersionedList<TSVersion> | Linter.RuleEntry;

export type RuleType = 'problem' | 'suggestion' | 'layout';

interface VersionedEntry<VersionType extends JSVersion | TSVersion | undefined>
{
    minVersion: VersionType;
    ruleEntry: Linter.RuleEntry;
}

export type VersionedList<VersionType extends JSVersion | TSVersion = JSVersion | TSVersion> =
[VersionedEntry<undefined>, ...VersionedEntry<VersionType>[]] & { versioned: true; };

export const UNIQUE = Symbol('Unique built-in rules');
export const HYBRID = Symbol('Hybrid rules');

function beforeOrElse
<VersionType extends JSVersion | TSVersion>
(version: VersionType, before: Linter.RuleEntry, else_: Linter.RuleEntry):
VersionedList<VersionType>
{
    const beforeEntry = { minVersion: undefined, ruleEntry: before };
    const elseEntry = { minVersion: version, ruleEntry: else_ };
    const array: [VersionedEntry<undefined>, VersionedEntry<VersionType>] =
    [beforeEntry, elseEntry];
    const versionedList = Object.assign(array, { versioned: true } as const);
    return versionedList;
}

export function getRuleKey(rulePrefix: string, ruleName: string): string
{
    return `${rulePrefix}/${ruleName}`;
}

export function getRulePrefix(pluginName: string): string
{
    const rulePrefix = pluginName.replace(/^eslint-plugin-|\/eslint-plugin$/, '');
    return rulePrefix;
}

function jsts(jsEntry: RuleSettingsJS, tsEntry: RuleSettingsTS): JSTSEntry
{
    return { js: jsEntry, ts: tsEntry };
}

export const RULES:
Record<string | symbol, PluginSettingsAny | PluginSettingsForLang> =
{
    [UNIQUE]:
    {
        ////////////////////////////////////////////
        // Problem
        'array-callback-return':            'off',
        'constructor-super':                'error',
        'for-direction':                    'error',
        'getter-return':                    'error',
        'no-async-promise-executor':        'error',
        'no-await-in-loop':                 'off',
        'no-class-assign':                  'error',
        'no-compare-neg-zero':              'error',
        'no-cond-assign':                   'off',
        'no-const-assign':                  'error',
        'no-constant-binary-expression':    'error',
        'no-constant-condition':            'error',
        'no-constructor-return':            'off',
        'no-control-regex':                 'off',
        'no-debugger':                      'error',
        'no-dupe-args':                     'error',
        'no-dupe-else-if':                  'error',
        'no-dupe-keys':                     'error',
        'no-duplicate-case':                'error',
        // TypeScript has type only imports.
        'no-duplicate-imports':             jsts('error', 'off'),
        'no-empty-character-class':         'error',
        'no-empty-pattern':                 'error',
        'no-ex-assign':                     'error',
        'no-fallthrough':                   'error',
        'no-func-assign':                   'error',
        'no-import-assign':                 'error',
        'no-inner-declarations':            'error',
        'no-invalid-regexp':                'error',
        'no-irregular-whitespace':          'error',
        'no-misleading-character-class':    'error',
        'no-new-symbol':                    'error',
        'no-obj-calls':                     'error',
        'no-promise-executor-return':       'error',
        'no-prototype-builtins':            'off',
        'no-self-assign':                   'error',
        'no-self-compare':                  'off',
        'no-setter-return':                 'error',
        'no-sparse-arrays':                 'off',
        'no-template-curly-in-string':      'off',
        'no-this-before-super':             'error',
        'no-undef':                         jsts('error', 'off'), // Not required in TypeScript.
        'no-unexpected-multiline':          'off',
        'no-unmodified-loop-condition':     'off',
        'no-unreachable':                   'error',
        'no-unreachable-loop':              'error',
        'no-unsafe-finally':                'error',
        'no-unsafe-negation':               'error',
        'no-unsafe-optional-chaining':      'error',
        'no-unused-private-class-members':  'error',
        'no-useless-backreference':         'error',
        'require-atomic-updates':           'off',
        'use-isnan':                        ['error', { enforceForSwitchCase: true }],
        'valid-typeof':                     'error',

        ////////////////////////////////////////////
        // Suggestion
        'accessor-pairs':                   ['error', { enforceForClassMembers: true }],
        'arrow-body-style':                 'error',
        'block-scoped-var':                 'off',
        'camelcase':                        'off',
        'capitalized-comments':             'off',
        'class-methods-use-this':           'off',
        'complexity':                       'off',
        'consistent-return':                'off',
        'consistent-this':                  'off',
        'curly':                            ['error', 'multi-or-nest'],
        'default-case':                     'off',
        'default-case-last':                'off',
        'eqeqeq':                           ['error', 'allow-null'],
        'func-name-matching':               'off',
        'func-names':                       ['error', 'never'],
        'func-style':                       'off',
        'grouped-accessor-pairs':           ['error', 'getBeforeSet'],
        'guard-for-in':                     'off',
        'id-denylist':                      'off',
        'id-length':                        'off',
        'id-match':                         'off',
        'max-classes-per-file':             'off',
        'max-depth':                        'off',
        'max-lines':                        'off',
        'max-lines-per-function':           'off',
        'max-nested-callbacks':             'off',
        'max-params':                       'off',
        'max-statements':                   'off',
        'multiline-comment-style':          'off',
        'new-cap':                          ['error', { capIsNew: false }],
        'no-alert':                         'error',
        'no-bitwise':                       'off',
        'no-caller':                        'error',
        'no-case-declarations':             'error',
        'no-confusing-arrow':               'off',
        'no-console':                       'off',
        'no-continue':                      'off',
        'no-delete-var':                    'error',
        'no-div-regex':                     'error',
        'no-else-return':                   'error',
        'no-empty':                         ['error', { allowEmptyCatch: true }],
        'no-eq-null':                       'off',
        'no-eval':                          'off',
        'no-extend-native':                 'error',
        'no-extra-bind':                    'error',
        'no-extra-boolean-cast':            'error',
        'no-extra-label':                   'error',
        'no-floating-decimal':              'error',
        'no-global-assign':                 'error',
        'no-implicit-coercion':             'off',
        'no-implicit-globals':              'off',
        'no-inline-comments':               'off',
        'no-iterator':                      'error',
        'no-label-var':                     'error',
        'no-labels':                        ['error', { allowLoop: true, allowSwitch: true }],
        'no-lone-blocks':                   'error',
        'no-lonely-if':                     'off',
        'no-mixed-operators':               'off',
        'no-multi-assign':                  'off',
        'no-multi-str':                     'error',
        'no-negated-condition':             'off',
        'no-nested-ternary':                'off',
        'no-new':                           'off',
        'no-new-func':                      'off',
        'no-new-object':                    'error',
        'no-new-wrappers':                  'error',
        'no-nonoctal-decimal-escape':       'error',
        'no-octal':                         'error',
        'no-octal-escape':                  'error',
        'no-param-reassign':                'off',
        'no-plusplus':                      'off',
        'no-proto':                         'error',
        'no-regex-spaces':                  'off',
        'no-restricted-exports':            'off',
        'no-restricted-globals':            'error',
        'no-restricted-properties':         'off',
        'no-restricted-syntax':             'error',
        'no-return-assign':                 ['error', 'always'],
        'no-return-await':                  'error',
        'no-script-url':                    'error',
        'no-sequences':                     'error',
        'no-shadow-restricted-names':       'error',
        'no-ternary':                       'off',
        'no-undef-init':                    'error',
        'no-undefined':                     'off',
        'no-underscore-dangle':             'off',
        'no-unneeded-ternary':              'error',
        'no-unused-labels':                 'error',
        'no-useless-call':                  'error',
        'no-useless-catch':                 'error',
        'no-useless-computed-key':          'error',
        'no-useless-concat':                'error',
        'no-useless-escape':                'error',
        'no-useless-rename':                'error',
        'no-useless-return':                'error',
        'no-var':                           jsts(beforeOrElse(2015, 'off', 'error'), 'error'),
        'no-void':                          'off',
        'no-warning-comments':              'off',
        'no-with':                          'error',
        'object-shorthand':                 'error',
        'one-var':                          ['error', 'never'],
        'one-var-declaration-per-line':     'error',
        'operator-assignment':              'error',
        'prefer-arrow-callback':            'error',
        'prefer-const':                     ['error', { ignoreReadBeforeAssign: true }],
        'prefer-destructuring':             'error',
        // Do not prefer the exponentiation operator in TypeScript, because that would result in
        // getting the value of Math.pow upon every evaluation in ES5 transpiled code.
        'prefer-exponentiation-operator':   jsts('error', 'off'),
        'prefer-named-capture-group':       'off',
        'prefer-numeric-literals':          'error',
        'prefer-object-has-own':            'error',
        'prefer-object-spread':             'off',
        'prefer-promise-reject-errors':     'off',
        'prefer-regex-literals':            'off',
        'prefer-rest-params':               'error',
        'prefer-spread':                    'error',
        'prefer-template':                  'error',
        'quote-props':                      'off',
        'radix':                            'error',
        'require-unicode-regexp':           'off',
        'require-yield':                    'error',
        'sort-imports':                     ['error', { ignoreDeclarationSort: true }],
        'sort-keys':                        'off',
        'sort-vars':                        'off',
        'spaced-comment':                   ['error', 'always', { exceptions: ['/'] }],
        'strict':                           jsts(['error', 'global'], 'off'),
        'symbol-description':               'off',
        'vars-on-top':                      'off',
        'yoda':                             'error',

        ////////////////////////////////////////////
        // Layout
        'array-bracket-newline':            ['error', 'consistent'],
        'array-bracket-spacing':            'error',
        'array-element-newline':            'off',
        'arrow-parens':                     ['error', 'as-needed'],
        'arrow-spacing':                    'error',
        'block-spacing':                    'error',
        'comma-style':
        ['error', 'last', { exceptions: { ArrayExpression: true } }],
        'computed-property-spacing':        'error',
        'dot-location':                     ['error', 'property'],
        'eol-last':                         'error',
        'function-call-argument-newline':   ['error', 'consistent'],
        'function-paren-newline':           ['error', 'consistent'],
        'generator-star-spacing':           ['error', 'both'],
        'implicit-arrow-linebreak':         'off',
        'jsx-quotes':                       'error',
        'key-spacing':                      ['error', { mode: 'minimum' }],
        'line-comment-position':            'off',
        'linebreak-style':                  'error',
        // In TypeScript files, lines-around-comment doesn't work well at the start of a block.
        'lines-around-comment':
        jsts(['error', { allowBlockStart: true, allowObjectStart: true }], 'off'),
        'max-len':                          ['error', { code: 100 }],
        'max-statements-per-line':          'error',
        'multiline-ternary':                'off',
        'new-parens':                       'error',
        'newline-per-chained-call':         'off',
        'no-mixed-spaces-and-tabs':         'off',
        'no-multi-spaces':                  'off',
        'no-multiple-empty-lines':          ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
        'no-tabs':                          'error',
        'no-trailing-spaces':               'error',
        'no-whitespace-before-property':    'error',
        'nonblock-statement-body-position': 'off',
        'object-curly-newline':             'off',
        'object-property-newline':          ['error', { allowMultiplePropertiesPerLine: true }],
        'operator-linebreak':               ['error', 'after'],
        'padded-blocks':                    ['error', 'never'],
        'rest-spread-spacing':              'error',
        'semi-spacing':                     'error',
        'semi-style':                       'error',
        'space-in-parens':                  'error',
        'space-unary-ops':                  'error',
        'switch-colon-spacing':             ['error', { after: true, before: false }],
        'template-curly-spacing':           'error',
        'template-tag-spacing':             ['error', 'always'],
        'unicode-bom':                      'error',
        'wrap-iife':                        'off',
        'wrap-regex':                       'off',
        'yield-star-spacing':               ['error', 'both'],
    },
    [HYBRID]:
    {
        ////////////////////////////////////////////
        // Problem
        'no-dupe-class-members':            'error',
        'no-loss-of-precision':             'error',
        'no-unused-vars':
        jsts
        (
            beforeOrElse
            (
                2019,
                ['error', { ignoreRestSiblings: true, vars: 'local' }],
                ['error', { caughtErrors: 'all', ignoreRestSiblings: true, vars: 'local' }],
            ),
            ['error', { caughtErrors: 'all', ignoreRestSiblings: true, vars: 'local' }],
        ),
        'no-use-before-define':             'off',

        ////////////////////////////////////////////
        // Suggestion
        'default-param-last':               'off',
        'dot-notation':                     'error',
        'init-declarations':                'off',
        'no-array-constructor':             'error',
        'no-empty-function':                'off',
        'no-extra-semi':                    'error',
        'no-implied-eval':                  'off',
        'no-invalid-this':                  'off',
        'no-loop-func':                     'error',
        'no-magic-numbers':                 'off',
        // Redeclarations are acceptable in TypeScript.
        'no-redeclare':                     jsts(['error', { builtinGlobals: true }], 'off'),
        'no-restricted-imports':            'off',
        'no-shadow':                        'off',
        'no-throw-literal':                 'error',
        'no-unused-expressions':            'error',
        'no-useless-constructor':           'error',
        'require-await':                    'error',

        ////////////////////////////////////////////
        // Layout
        'brace-style':                      ['error', 'allman'],
        'comma-dangle':                     ['error', 'always-multiline'],
        'comma-spacing':                    'error',
        'func-call-spacing':                'off',
        // typescript-eslint rule is flawed.
        'indent':
        jsts
        (
            [
                'error',
                4,
                {
                    CallExpression: { arguments: 'first' },
                    FunctionDeclaration: { parameters: 'first' },
                    FunctionExpression: { parameters: 'first' },
                    MemberExpression: 0,
                    VariableDeclarator: 0,
                    ignoredNodes:
                    [
                        'ArrowFunctionExpression',
                        'ClassDeclaration[superClass]',
                        'ConditionalExpression',
                        'ImportDeclaration',
                    ],
                },
            ],
            'off',
        ),
        'keyword-spacing':                  'error',
        'lines-between-class-members':      'off',
        'no-extra-parens':                  'error',
        'object-curly-spacing':             ['error', 'always'],
        'padding-line-between-statements':
        [
            'error',
            {
                blankLine: 'always',
                prev: '*',
                next: ['class', 'directive', 'export', 'function', 'import'],
            },
            {
                blankLine: 'always',
                prev: ['class', 'directive', 'export', 'function', 'import'],
                next: '*',
            },
            { blankLine: 'any', prev: 'export', next: 'export' },
            { blankLine: 'any', prev: 'import', next: 'import' },
        ],
        'quotes':                           ['error', 'single'],
        'semi':                             'error',
        'space-before-blocks':              'error',
        'space-before-function-paren':      'off',
        // typescript-eslint rule does not handle well colons (":") in mapped types.
        'space-infix-ops':                  jsts('error', 'off'),
    },
    '@typescript-eslint/eslint-plugin':
    {
        [FOR_LANG]: 'ts',

        ////////////////////////////////////////////
        // Problem
        'await-thenable':                           'error',
        'ban-ts-comment':                           'off',
        'class-literal-property-style':             ['error', 'getters'],
        'explicit-function-return-type':
        ['error', { allowTypedFunctionExpressions: false }],
        'explicit-member-accessibility':            'error',
        'explicit-module-boundary-types':           'error',
        'no-confusing-non-null-assertion':          'error',
        'no-confusing-void-expression':             'off',
        'no-duplicate-enum-values':                 'off',
        'no-extra-non-null-assertion':              'error',
        'no-floating-promises':                     'error',
        'no-for-in-array':                          'error',
        'no-invalid-void-type':                     'off',
        'no-misused-new':                           'error',
        'no-misused-promises':                      'error',
        'no-non-null-asserted-nullish-coalescing':  'error',
        'no-non-null-asserted-optional-chain':      'error',
        'no-non-null-assertion':                    'off',
        'no-require-imports':                       'error',
        'no-unsafe-argument':                       'error',
        'no-unsafe-assignment':                     'error',
        'no-unsafe-call':                           'off',
        'no-unsafe-member-access':                  'error',
        'no-unsafe-return':                         'error',
        'no-var-requires':                          'error',
        'parameter-properties':                     ['error', { prefer: 'parameter-property' }],
        'prefer-reduce-type-parameter':             'error',
        'prefer-ts-expect-error':                   'error',
        'require-array-sort-compare':               'off',
        'restrict-plus-operands':                   'off',
        'restrict-template-expressions':            'off',
        'return-await':                             'error',
        'unbound-method':                           'off',

        ////////////////////////////////////////////
        // Suggestion
        'adjacent-overload-signatures':             'error',
        'array-type':                               'error',
        'ban-tslint-comment':                       'error',
        'ban-types':                                'off',
        'consistent-generic-constructors':          'error',
        'consistent-indexed-object-style':          'error',
        'consistent-type-assertions':               'error',
        'consistent-type-definitions':              ['error', 'interface'],
        'consistent-type-exports':                  'error',
        'consistent-type-imports':
        beforeOrElse
        (
            '3.8.0',
            ['error', { prefer: 'no-type-imports' }],
            'error',
        ),
        'member-delimiter-style':
        ['error', { singleline: { requireLast: true } }],
        'member-ordering':                          'error',
        'method-signature-style':                   'off',
        'naming-convention':                        'off',
        'no-base-to-string':                        'error',
        'no-dynamic-delete':                        'off',
        'no-empty-interface':                       ['error', { allowSingleExtends: true }],
        'no-explicit-any':                          'off',
        'no-extraneous-class':                      ['error', { allowConstructorOnly: true }],
        'no-inferrable-types':                      'error',
        'no-meaningless-void-operator':             ['error', { checkNever: true }],
        'no-namespace':                             'off',
        'no-redundant-type-constituents':           'error',
        'no-this-alias':                            'off',
        'no-type-alias':                            'off',
        'no-unnecessary-boolean-literal-compare':   'error',
        'no-unnecessary-condition':                 'error',
        'no-unnecessary-qualifier':                 'error',
        'no-unnecessary-type-arguments':            'error',
        'no-unnecessary-type-assertion':            'error',
        'no-unnecessary-type-constraint':           'error',
        'no-useless-empty-export':                  'error',
        'non-nullable-type-assertion-style':        'error',
        'prefer-as-const':                          'error',
        'prefer-enum-initializers':                 'off',
        'prefer-for-of':                            'error',
        // https://github.com/typescript-eslint/typescript-eslint/issues/454
        'prefer-function-type':                     'off',
        'prefer-includes':                          'error',
        'prefer-literal-enum-member':               'off',
        'prefer-namespace-keyword':                 'off',
        'prefer-nullish-coalescing':                'error',
        'prefer-optional-chain':                    'error',
        'prefer-readonly':                          'error',
        'prefer-readonly-parameter-types':          'off',
        'prefer-regexp-exec':                       'error',
        'prefer-return-this-type':                  'error',
        'prefer-string-starts-ends-with':           'error',
        'promise-function-async':                   ['error', { allowAny: true }],
        'sort-type-union-intersection-members':     'off',
        'strict-boolean-expressions':               'off',
        'switch-exhaustiveness-check':              'error',
        'triple-slash-reference':                   ['error', { lib: 'never' }],
        'typedef':                                  'error',
        'unified-signatures':                       'error',

        ////////////////////////////////////////////
        // Layout
        'type-annotation-spacing':                  'error',
    },
    '@origin-1/eslint-plugin':
    {
        ////////////////////////////////////////////
        // Layout
        'nice-space-before-function-paren': 'error',
        'no-spaces-in-call-expression':     'error',
    },
    'eslint-plugin-n':
    {
        ////////////////////////////////////////////
        // Problem
        'no-callback-literal':                      'off',
        'no-deprecated-api':                        'error',
        'no-exports-assign':                        'error',
        // Does not handle type declaration imports.
        'no-extraneous-import':                     jsts('error', 'off'),
        'no-extraneous-require':                    'error',
        // Does not handle package.json "exports" and "imports" and type declaration imports.
        'no-missing-import':                        'off',
        // Does not handle package.json "exports" and "imports".
        'no-missing-require':                       'off',
        'no-unpublished-bin':                       'error',
        'no-unpublished-import':                    'error',
        'no-unpublished-require':                   'error',
        'no-unsupported-features/es-builtins':      'off',
        'no-unsupported-features/es-syntax':        'off',
        'no-unsupported-features/node-builtins':    'off',
        'process-exit-as-throw':                    'error',
        'shebang':                                  'off',

        ////////////////////////////////////////////
        // Suggestion
        'callback-return':                          'off',
        'exports-style':                            'off',
        'file-extension-in-import':                 'off',
        'global-require':                           'off',
        'handle-callback-err':                      'error',
        'no-mixed-requires':                        'error',
        'no-new-require':                           'error',
        'no-path-concat':                           'error',
        'no-process-env':                           'off',
        'no-process-exit':                          'off',
        'no-restricted-import':                     'error',
        'no-restricted-require':                    'error',
        'no-sync':                                  'off',
        'prefer-global/buffer':                     'error',
        'prefer-global/console':                    'error',
        'prefer-global/process':                    'error',
        'prefer-global/text-decoder':               'error',
        'prefer-global/text-encoder':               'error',
        'prefer-global/url':                        'error',
        'prefer-global/url-search-params':          'error',
        'prefer-promises/dns':                      'error',
        'prefer-promises/fs':                       'off',
    },
};
