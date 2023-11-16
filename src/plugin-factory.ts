import { promises as fs, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import type { HtmlTagDescriptor, IndexHtmlTransformResult } from 'vite';
import type { Plugin, ConfigEnv, UserConfig } from 'vite';
import type { InputOption, PreserveEntrySignaturesOption, RenderedChunk } from 'rollup';
import type { SingleSpaPluginOptions, SingleSpaRootPluginOptions, SingleSpaMifePluginOptions, ImportMap, ImoUiOption, DebuggingOptions } from "vite-plugin-single-spa";
import { extensionModuleName } from './ex-defs.js';
import { closeLog, openLog, writeToLog } from './debug.js';

/*
NOTE:
-----

Import map logic mostly taken from vite-plugin-import-maps (https://github.com/pakholeung37/vite-plugin-import-maps).

It's been modified to suit single-spa.

LEGAL NOTICE
------------

vite-plugin-import-maps was under the MIT license at the time this project borrowed from it.
*/

/**
 * Determines if the provided configuration options object is for a root project or not.
 * @param config Plugin configuration options.
 * @returns True if the options are for a root project; false otherwise.
 */
function isRootConfig(config: SingleSpaPluginOptions): config is SingleSpaRootPluginOptions {
    return config.type === 'root';
}

/**
 * Factory function that produces the vite-plugin-single-spa plugin factory.  Yes, a factory of a factory.
 * 
 * This indirection exists to allow for unit testing.
 * @param readFileFn Function used to read files.
 * @param fileExistsFn Function used to determine if a particular file name represents an existing file.
 * @returns The plug-in factory function.
 */
export function pluginFactory(readFileFn?: (path: string, options: any) => Promise<string>, fileExistsFn?: (path: string) => boolean): (config: SingleSpaPluginOptions) => Plugin {
    const readFile = readFileFn ?? fs.readFile;
    const fileExists = fileExistsFn ?? existsSync;
    return (config: SingleSpaPluginOptions) => {
        const lg = config.logging;
        if (lg?.chunks || lg?.config || lg?.incomingConfig) {
            openLog(lg?.fileName);
        }
        let configFn: ((viteOpts: ConfigEnv) => UserConfig | Promise<UserConfig>) | undefined = mifeConfig;
        let htmlXformFn: (html: string) => IndexHtmlTransformResult | void | Promise<IndexHtmlTransformResult | void> = () => { return; };
        let viteEnv: ConfigEnv;
        const baseModulePath = path.dirname(fileURLToPath(import.meta.url));
        let cssModuleFileName: string;
        let exModule: string;
        let projectId: string;
        const cssMap: Record<string, string[]> = {};
        config.type = config.type ?? 'mife';
        if (isRootConfig(config)) {
            configFn = undefined;
            htmlXformFn = rootIndexTransform;
        }

        /**
         * Builds a full path using the provided file name and this module's file location.
         * @param fileName Module file name (just name and extension).
         * @returns The full path of the module.
         */
        function buildPeerModulePath(fileName: string) {
            return path.resolve(path.join(baseModulePath), fileName);
        }

        /**
         * Builds the Ex dynamic module.
         * @returns The finalized contents of the "vite-plugin-single-spa/ex" module.
         */
        async function buildExModule() {
            return (await readFile(buildPeerModulePath('vite-env.js'), { encoding: 'utf8' }) as string)
                .replace("'{serving}'", `${viteEnv.command === 'serve'}`)
                .replace("'{built}'", `${viteEnv.command === 'build'}`)
                .replace('{mode}', viteEnv.mode)
                + '\n' + (await readFile(buildPeerModulePath(cssModuleFileName), { encoding: 'utf8' }));
        }

        /**
         * Loads the import map files (JSON files) that are pertinent to the occasion.
         * @param command Vite command (serve or build).
         * @returns An array of string values, where each value is the content of one import map file.
         */
        async function loadImportMaps(command: ConfigEnv['command']) {
            const cfg = config as SingleSpaRootPluginOptions;
            let fileCfg = command === 'serve' ? cfg.importMaps?.dev : cfg.importMaps?.build;
            const defaultFile = fileExists('src/importMap.dev.json') ? 'src/importMap.dev.json' : 'src/importMap.json';
            if (fileCfg === undefined || typeof fileCfg === 'string') {
                const mapFile = command === 'serve' ?
                    (fileCfg ?? defaultFile) :
                    (fileCfg ?? 'src/importMap.json');
                if (!fileExists(mapFile)) {
                    return null;
                }
                const contents = await readFile(mapFile, {
                    encoding: 'utf8'
                }) as string;
                return [contents];
            }
            else {
                const fileContents: string[] = [];
                for (let f of fileCfg) {
                    const contents = await readFile(f, { encoding: 'utf8' }) as string;
                    fileContents.push(contents);
                }
                return fileContents;
            }
        }

        /**
         * Builds and returns the final import map using as input the provided input maps.
         * @param maps Array of import maps that are merged together as a single map.
         */
        function buildImportMap(maps: Required<ImportMap>[]) {
            const importMap: Required<ImportMap> = { imports: {}, scopes: {} };
            for (let map of maps) {
                for (let key of Object.keys(map.imports)) {
                    importMap.imports[key] = map.imports[key];
                }
                if (map.scopes) {
                    for (let key of Object.keys(map.scopes)) {
                        importMap.scopes[key] = {
                            ...importMap.scopes[key],
                            ...map.scopes[key]
                        }
                    }
                }
            }
            return importMap;
        }

        /**
         * Builds the configuration required for single-spa micro-frontends.
         * @param viteOpts Vite options.
         * @returns An object with the necessary Vite options for single-spa micro-frontends.
         */
        async function mifeConfig(viteOpts: ConfigEnv) {
            const cfg: UserConfig = {};
            if (!config) {
                return cfg;
            }
            projectId = (config as SingleSpaMifePluginOptions).projectId ??
                (JSON.parse(await readFile('./package.json', { encoding: 'utf8' }) as string)).name;
            projectId = projectId.substring(0, 20);
            cfg.server = {
                port: (config as SingleSpaMifePluginOptions).serverPort,
                origin: `http://localhost:${(config as SingleSpaMifePluginOptions).serverPort}`
            };
            cfg.preview = {
                port: (config as SingleSpaMifePluginOptions).serverPort
            };
            const entryFileNames = '[name].js';
            const input: InputOption = {};
            let preserveEntrySignatures: PreserveEntrySignaturesOption;
            if (viteOpts.command === 'build') {
                let entryPoints = (config as SingleSpaMifePluginOptions)?.spaEntryPoints ?? 'src/spa.ts';
                if (typeof entryPoints === 'string') {
                    entryPoints = [entryPoints];
                }
                for (let ep of entryPoints) {
                    input[path.parse(ep).name] = ep;
                }
                preserveEntrySignatures = 'exports-only';
            }
            else {
                input['index'] = 'index.html';
                preserveEntrySignatures = false;
            }
            cfg.build = {
                rollupOptions: {
                    input,
                    preserveEntrySignatures,
                    output: {
                        exports: 'auto',
                        assetFileNames: ai => {
                            if (ai.name?.endsWith('.css')) {
                                return `assets/vpss(${projectId})[name]-[hash][extname]`;
                            }
                            return 'assets/[name]-[hash][extname]';
                        },
                        entryFileNames
                    }
                }
            };
            if (lg?.config) {
                writeToLog('Config: %o', cfg);
            }
            return cfg;
        }

        /**
         * Transforms the HTML file of single-spa root projects by injecting import maps and the import-map-overrides 
         * script.
         * @param html HTML file content in string format.
         * @returns An IndexHtmlTransformResult object that includes the necessary transformation in root projects.
         */
        async function rootIndexTransform(html: string) {
            const cfg = config as SingleSpaRootPluginOptions;
            const importMapContents = await loadImportMaps(viteEnv.command);
            let importMap: Required<ImportMap> | undefined = undefined;
            if (importMapContents) {
                importMap = buildImportMap(importMapContents.map(t => JSON.parse(t)));
            }
            const tags: HtmlTagDescriptor[] = [];
            if (importMap) {
                tags.push({
                    tag: 'script',
                    attrs: {
                        type: cfg.importMaps?.type ?? 'overridable-importmap',
                    },
                    children: JSON.stringify(importMap, null, 2),
                    injectTo: 'head-prepend',
                });
            }
            if (cfg.imo !== false && importMap) {
                let imoVersion = 'latest';
                if (typeof cfg.imo === 'string') {
                    imoVersion = cfg.imo;
                }
                const imoUrl = typeof cfg.imo === 'function' ? cfg.imo() : `https://cdn.jsdelivr.net/npm/import-map-overrides@${imoVersion}/dist/import-map-overrides.js`;
                tags.push({
                    tag: 'script',
                    attrs: {
                        type: 'text/javascript',
                        src: imoUrl
                    },
                    injectTo: 'head-prepend'
                });
            }
            let imoUiCfg: ImoUiOption = {
                buttonPos: 'bottom-right',
                localStorageKey: 'imo-ui',
                variant: 'full'
            };
            if (typeof cfg.imoUi === 'object') {
                imoUiCfg = {
                    ...imoUiCfg,
                    ...cfg.imoUi
                };
            }
            else if (cfg.imoUi !== undefined) {
                imoUiCfg.variant = cfg.imoUi;
            }
            if (imoUiCfg.variant && importMap) {
                imoUiCfg.variant = imoUiCfg.variant === true ? 'full' : imoUiCfg.variant;
                let attrs: Record<string, string | boolean | undefined> | undefined = undefined;
                if (imoUiCfg.variant === 'full') {
                    attrs = {
                        'trigger-position': imoUiCfg.buttonPos,
                        'show-when-local-storage': imoUiCfg.localStorageKey
                    };
                }
                tags.push({
                    tag: `import-map-overrides-${imoUiCfg.variant}`,
                    attrs,
                    injectTo: 'body'
                });
            }
            return {
                html,
                tags
            };
        }

        return {
            name: 'vite-plugin-single-spa',
            async config(cfg, opts) {
                viteEnv = opts;
                cssModuleFileName = viteEnv.command === 'build' ? `${(config as SingleSpaMifePluginOptions).cssStrategy ?? 'singleMife'}-css.js` : 'no-css.js';
                if (lg?.incomingConfig) {
                    writeToLog('Incoming Config: %o', cfg);
                }
                if (configFn) {
                    return await configFn(opts);
                }
                if (viteEnv.command === 'serve') {
                    closeLog();
                }
                return {};
            },
            resolveId(source, _importer, _options) {
                if (source === extensionModuleName) {
                    return source;
                }
                return null;
            },
            async load(id, _options) {
                if (id === extensionModuleName) {
                    return exModule = exModule ?? (await buildExModule());
                }
            },
            renderChunk: {
                order: 'post',
                handler(_code, chunk, options, meta) {
                    if (lg?.chunks) {
                        writeToLog("Chunk Information");
                        writeToLog("=================\n");
                        writeToLog("======== %s ========", chunk.fileName);
                        chunk.viteMetadata?.importedCss.forEach(css => {
                            writeToLog('Imported CSS: %s', css);
                        });
                        writeToLog("chunk: %o", chunk);
                        writeToLog("options: %o", options);
                        writeToLog("meta: %o", meta);
                    }
                    if (chunk.isEntry) {
                        // Recursively collect all CSS files that this entry point might need.
                        const cssFiles = new Set<string>();
                        const processedImports = new Set<string>();
                        const collectCssFiles = (curChunk: RenderedChunk) => {
                            curChunk.viteMetadata?.importedCss.forEach(css => cssFiles.add(css));
                            for (let imp of curChunk.imports) {
                                if (processedImports.has(imp)) {
                                    continue;
                                }
                                processedImports.add(imp);
                                collectCssFiles(meta.chunks[imp]);
                            }
                        };
                        collectCssFiles(chunk);
                        cssMap[chunk.name] = [];
                        for (let css of cssFiles.values()) {
                            cssMap[chunk.name].push(css);
                        }
                    }
                },
            },
            generateBundle(_options, bundle, _isWrite) {
                if (viteEnv.command === 'build') {
                    closeLog();
                }
                const stringifiedCssMap = JSON.stringify(JSON.stringify(cssMap));
                for (let x in bundle) {
                    const entry = bundle[x];
                    if (entry.type === 'chunk') {
                        entry.code = entry.code
                            ?.replace('{vpss:PROJECT_ID}', projectId)
                            .replace('"{vpss:CSS_MAP}"', stringifiedCssMap);
                    }
                }
            },
            transformIndexHtml: {
                order: 'post',
                handler(html: string) {
                    return htmlXformFn(html)
                },
            },
        };
    };
};
