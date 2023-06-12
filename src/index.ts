import { HtmlTagDescriptor, IndexHtmlTransformResult } from 'vite';
import type { Plugin, ConfigEnv, UserConfig } from 'vite';
import type { InputOption } from 'rollup';
import { promises as fs, existsSync } from 'fs';
import type { SingleSpaPluginOptions, SingleSpaRootPluginOptions, SingleSpaMifePluginOptions, ImportMap } from "vite-plugin-single-spa";

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

export function vitePluginSingleSpa(config?: SingleSpaPluginOptions): Plugin {
    console.debug('Config passed to plugin: %o', config);
    let configFn: (viteOpts: ConfigEnv) => UserConfig | Promise<UserConfig> = mifeConfig;
    let htmlXformFn: (html: string) => IndexHtmlTransformResult | void | Promise<IndexHtmlTransformResult | void> = () => { return; };
    if (isRootConfig(config ?? { type: 'mife' })) {
        configFn = rootConfig;
        htmlXformFn = rootIndexTransform
    }

    /**
     * Loads the import map file (JSON files) that is pertinent to the occasion.
     * @param command Vite command (serve or build).
     * @returns A promise that resolves with the file's text content; if the file doesn't exist then null is returned.
     */
    function loadImportMap(command: string) {
        const cfg = config as SingleSpaRootPluginOptions;
        console.debug('loadImportMap --- command: %s', command);
        const defaultFile = existsSync('src/importMap.dev.json') ? 'src/importMap.dev.json' : 'src/importMap.json';
        const mapFile = command === 'serve' ?
            (cfg.importMaps?.dev ?? defaultFile) :
            (cfg.importMaps?.build ?? 'src/importMap.json');
        if (!existsSync(mapFile)) {
            return null;
        }
        return fs.readFile(mapFile, {
            encoding: 'utf8'
        });
    }

    let importMap: Required<ImportMap>;

    /**
     * Builds the final import map using as input the provided input maps.
     * @param maps Array of import maps that are merged together as a single map.
     */
    function buildImportMap(maps: Required<ImportMap>[]) {
        const oriImportMap: Required<ImportMap> = Object.assign(
            { imports: {}, scope: {} },
            ...maps,
        );
        importMap = {
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
            scope: {
                ...oriImportMap.scope,
            },
        };
    }

    /**
     * Builds the configuration required for single-spa root projects.
     * @param viteOpts Vite options.
     * @returns An object with the necessary Vite options for single-spa root projects.
     */
    async function rootConfig(viteOpts: ConfigEnv) {
        const importMapText = await loadImportMap(viteOpts.command);
        console.debug('Import map text: %s', importMapText);
        if (importMapText) {
            buildImportMap([JSON.parse(importMapText)]);
            console.debug('IM ready: %o', importMap);
        }
        return {};
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
        if ((config as SingleSpaMifePluginOptions).serverPort) {
            cfg.server = {
                port: (config as SingleSpaMifePluginOptions).serverPort
            };
            cfg.preview = {
                port: (config as SingleSpaMifePluginOptions).serverPort
            };
            if (viteOpts.command === 'serve') {
                // Development server.
                cfg.base = `http://localhost:${(config as SingleSpaMifePluginOptions).serverPort}`;
            }
        }
        const assetFileNames = 'assets/[name][extname]';
        const entryFileNames = '[name].js';
        const input: InputOption = {};
        let preserveEntrySignatures: false | 'strict' | 'allow-extension' | 'exports-only';
        if (viteOpts.command === 'build') {
            input['spa'] = (config as SingleSpaMifePluginOptions)?.spaEntryPoint ?? 'src/spa.ts';
            preserveEntrySignatures = 'exports-only';
            if ((config as SingleSpaMifePluginOptions).deployedBase) {
                cfg.base = (config as SingleSpaMifePluginOptions).deployedBase;
            }
        }
        else {
            input['index'] = 'index.html';
            preserveEntrySignatures = false;
        }
        cfg.build = {
            target: 'es2022',
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
    function rootIndexTransform(html: string) {
        const cfg = config as SingleSpaRootPluginOptions;
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
        if (!(cfg.includeImo === false) && importMap) {
            const imoVersion = cfg.imoVersion ?? 'latest'
            tags.push({
                tag: 'script',
                attrs: {
                    type: 'text/javascript',
                    src: `https://cdn.jsdelivr.net/npm/import-map-overrides@${imoVersion}/dist/import-map-overrides.js`
                },
                injectTo: 'head-prepend'
            });
        }
        return {
            html,
            tags
        };
    }

    return {
        name: 'vite-plugin-single-spa',
        async config(_cfg, opts) {
            return await configFn(opts);
        },
        transformIndexHtml: {
            order: 'post',
            handler(html: string) {
                return htmlXformFn(html)
            },
        },
    };
};

export default vitePluginSingleSpa;
