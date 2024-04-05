const parser =
Object.freeze({ parse(): never { throw Error('missing configuration for this file'); } });

const noParserConfig = Object.freeze({ languageOptions: Object.freeze({ parser }) });

export { noParserConfig };
