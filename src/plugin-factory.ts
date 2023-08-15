import { promises as fs, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import type { HtmlTagDescriptor, IndexHtmlTransformResult } from 'vite';
import type { Plugin, ConfigEnv, UserConfig } from 'vite';
import type { InputOption, PreserveEntrySignaturesOption } from 'rollup';
import type { SingleSpaPluginOptions, SingleSpaRootPluginOptions, SingleSpaMifePluginOptions, ImportMap, ImoUiOption } from "vite-plugin-single-spa";
import { extensionModuleName } from './ex-defs.js';

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
        let configFn: ((viteOpts: ConfigEnv) => UserConfig | Promise<UserConfig>) | undefined = mifeConfig;
        let htmlXformFn: (html: string) => IndexHtmlTransformResult | void | Promise<IndexHtmlTransformResult | void> = () => { return; };
        let viteEnv: ConfigEnv;
        const baseModulePath = path.dirname(fileURLToPath(import.meta.url));
        let cssModuleFileName: string;
        let exModule: string;
        if (isRootConfig(config ?? { type: 'mife', serverPort: 0 })) {
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
         * Loads the import map file (JSON files) that is pertinent to the occasion.
         * @param command Vite command (serve or build).
         * @returns A promise that resolves with the file's text content; if the file doesn't exist then null is returned.
         */
        function loadImportMap(command: string) {
            const cfg = config as SingleSpaRootPluginOptions;
            const defaultFile = fileExists('src/importMap.dev.json') ? 'src/importMap.dev.json' : 'src/importMap.json';
            const mapFile = command === 'serve' ?
                (cfg.importMaps?.dev ?? defaultFile) :
                (cfg.importMaps?.build ?? 'src/importMap.json');
            if (!fileExists(mapFile)) {
                return null;
            }
            return readFile(mapFile, {
                encoding: 'utf8'
            });
        }

        /**
         * Builds and returns the final import map using as input the provided input maps.
         * @param maps Array of import maps that are merged together as a single map.
         */
        function buildImportMap(maps: Required<ImportMap>[]) {
            const oriImportMap: Required<ImportMap> = Object.assign(
                { imports: {}, scopes: {} },
                ...maps,
            );
            return {
                imports: {
                    ...oriImportMap.imports,
                    ...Object.keys(oriImportMap.imports).reduce(
                        (acc, imp) => ({
                            ...acc,
                            // [`${prefix}${imp}`]: oriImportMap.imports[imp],
                            [`${imp}`]: oriImportMap.imports[imp],
                        }),
                        {},
                    ),
                },
                scopes: {
                    ...oriImportMap.scopes,
                },
            };
        }

        /**
         * Builds the configuration required for single-spa micro-frontends.
         * @param viteOpts Vite options.
         * @returns An object with the necessary Vite options for single-spa micro-frontends.
         */
        function mifeConfig(viteOpts: ConfigEnv) {
            const cfg: UserConfig = {};
            if (!config) {
                return cfg;
            }
            cfg.server = {
                port: (config as SingleSpaMifePluginOptions).serverPort
            };
            cfg.preview = {
                port: (config as SingleSpaMifePluginOptions).serverPort
            };
            const assetFileNames = 'assets/[name][extname]';
            const entryFileNames = '[name].js';
            const input: InputOption = {};
            let preserveEntrySignatures: PreserveEntrySignaturesOption;
            if (viteOpts.command === 'build') {
                input['spa'] = (config as SingleSpaMifePluginOptions)?.spaEntryPoint ?? 'src/spa.ts';
                preserveEntrySignatures = 'exports-only';
                cfg.base = (config as SingleSpaMifePluginOptions).deployedBase ?? `http://localhost:${(config as SingleSpaMifePluginOptions).serverPort}`;
            }
            else {
                input['index'] = 'index.html';
                preserveEntrySignatures = false;
            }
            cfg.build = {
                manifest: true,
                rollupOptions: {
                    input,
                    preserveEntrySignatures,
                    output: {
                        exports: 'auto',
                        assetFileNames,
                        entryFileNames
                    }
                }
            };
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
            const importMapText = await loadImportMap(viteEnv.command) as string;
            let importMap: Required<ImportMap> | undefined = undefined;
            if (importMapText) {
                importMap = buildImportMap([JSON.parse(importMapText)]);
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
            config(_cfg, opts) {
                viteEnv = opts;
                cssModuleFileName = viteEnv.command === 'build' ? 'css.js' : 'no-css.js';
                if (configFn) {
                    return configFn(opts);
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
            generateBundle(_options, bundle, _isWrite) {
                for (let x in bundle) {
                    const entry = bundle[x];
                    if (entry.type === 'chunk' && entry.isEntry) {
                        let cssFiles = '';
                        entry.viteMetadata?.importedCss.forEach(css => cssFiles += `,"${css}"`);
                        if (cssFiles.length > 0) {
                            cssFiles = cssFiles.substring(1);
                        }
                        entry.code = entry.code.replace('"{CSS_FILE_LIST}"', cssFiles);
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
