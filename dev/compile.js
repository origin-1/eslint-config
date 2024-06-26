#!/usr/bin/env node

import { extname, isAbsolute, join, relative }  from 'node:path';
import { fileURLToPath }                        from 'node:url';
import fastGlob                                 from 'fast-glob';
import ts                                       from 'typescript';

const TS_EXTNAMES = ['.ts', '.cts', '.mts'];

async function compileTS(pkgDir, rootDir, newOptions, writeFile)
{
    const { sys } = ts;
    const program =
    await
    (
        async () =>
        {
            const fileNames = await fastGlob('**/*.ts', { absolute: true, cwd: rootDir });
            const tsConfigPath = join(pkgDir, 'tsconfig.json');
            const tsConfig = ts.readConfigFile(tsConfigPath, sys.readFile);
            const { options } = ts.parseJsonConfigFileContent(tsConfig.config, sys, pkgDir);
            Object.assign(options, newOptions);
            const program = ts.createProgram(fileNames, options);
            return program;
        }
    )
    ();
    const emitResult = program.emit(undefined, writeFile);
    const diagnostics = [...ts.getPreEmitDiagnostics(program), ...emitResult.diagnostics];
    if (diagnostics.length)
    {
        const reporter = ts.createDiagnosticReporter(sys, true);
        diagnostics.forEach(reporter);
    }
    if (emitResult.emitSkipped)
        throw Error('TypeScript compilation failed');
}

function getWriteFile(sysWriteFile, declarationDir, dTsFilter)
{
    const writeFile =
    dTsFilter === undefined ?
    sysWriteFile :
    (path, data, writeByteOrderMark) =>
    {
        const relativePath = relative(declarationDir, path);
        if
        (
            /^\.\.[/\\]/.test(relativePath) ||
            isAbsolute(relativePath) ||
            !TS_EXTNAMES.includes(extname(relativePath)) ||
            dTsFilter.includes(relativePath.replaceAll('\\', '/'))
        )
            sysWriteFile(path, data, writeByteOrderMark);
    };
    return writeFile;
}

const pkgDir = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(pkgDir, 'dist');
const rootDir = join(pkgDir, 'src');
const newOptions =
{
    declaration:        true,
    declarationDir:     outDir,
    module:             ts.ModuleKind.CommonJS,
    moduleResolution:   ts.ModuleResolutionKind.Node10,
    outDir,
    removeComments:     true,
    rootDir:            join(pkgDir, 'src'),
};
const writeFile =
getWriteFile
(
    ts.sys.writeFile,
    outDir,
    [
        'index.d.ts',
        'lib/create-config.d.ts',
        'lib/no-parser-config.d.ts',
        'lib/normalize-version.d.ts',
    ],
);
await compileTS(pkgDir, rootDir, newOptions, writeFile);
