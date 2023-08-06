/// <reference path="../src/vite-plugin-single-spa.d.ts"/>
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { pluginFactory } from '../src/plugin-factory.js';

import type { SingleSpaRootPluginOptions, SingleSpaMifePluginOptions, ImportMapsOption } from "vite-plugin-single-spa";
import type { ConfigEnv, IndexHtmlTransformHook, UserConfig } from 'vite';
import type { PreserveEntrySignaturesOption, OutputOptions } from 'rollup';

type ConfigHandler = (this: void, config: UserConfig, env: ConfigEnv) => Promise<UserConfig>

const viteCommands: ConfigEnv['command'][] = [
    'serve',
    'build'
];

const viteModes: ConfigEnv['mode'][] = [
    'development',
    'production'
];

// Plug-in for all tests that don't require mocking.
const vitePluginSingleSpa = pluginFactory();

describe('vite-plugin-single-spa', () => {
    describe('Micro-Frontend Configuration', () => {
        it('Should default to micro-frontend configuration if type is not specified.', async () => {
            // Arrange.
            const options: SingleSpaMifePluginOptions = { serverPort: 4100 };
            const plugIn = vitePluginSingleSpa(options);
            const env: ConfigEnv = { command: 'serve', mode: 'development' };

            // Act.
            const config = await (plugIn.config as ConfigHandler)({}, env);

            // Assert.
            expect(config.build).to.not.equal(undefined)
            expect(config.build!.rollupOptions).to.not.equal(undefined);
        });
        const portTest = async (cmd: ConfigEnv['command']) => {
            // Arrange.
            const options: SingleSpaMifePluginOptions = { serverPort: 4111 };
            const plugIn = vitePluginSingleSpa(options);
            const env: ConfigEnv = { command: cmd, mode: 'development' };

            // Act.
            const config = await (plugIn.config as ConfigHandler)({}, env);

            // Assert.
            expect(config.server).to.not.equal(undefined);
            expect(config.server!.port).to.equal(options.serverPort);
            expect(config.preview!.port).to.equal(options.serverPort);
        };
        for (let cmd of viteCommands) {
            it(`Should set the server and preview ports equal to the given port number: ${cmd}`, () => portTest(cmd));
        }
        const inputTest = async (inputProp: string, viteCmd: ConfigEnv['command']) => {
            // Arrange.
            const options: SingleSpaMifePluginOptions = { serverPort: 4111 };
            const plugIn = vitePluginSingleSpa(options);
            const env: ConfigEnv = { command: viteCmd, mode: 'development' };

            // Act.
            const config = await (plugIn.config as ConfigHandler)({}, env);

            // Assert.
            const input = config?.build?.rollupOptions?.input;
            expect(input).to.not.equal(undefined);
            expect(input).to.haveOwnProperty(inputProp);
        };
        it('Should specify the input "spa" on build under the rollup options.', () => inputTest('spa', 'build'));
        it('Should specify the input "index" on serve under the rollup options.', () => inputTest('index', 'serve'));
        const entrySignatureTest = async (viteCmd: ConfigEnv['command'], expectedPropValue: PreserveEntrySignaturesOption) => {
            // Arrange.
            const options: SingleSpaMifePluginOptions = { serverPort: 4111 };
            const plugIn = vitePluginSingleSpa(options);
            const env: ConfigEnv = { command: viteCmd, mode: 'development' };

            // Act.
            const config = await (plugIn.config as ConfigHandler)({}, env);

            // Assert.
            const rollupOpts = config?.build?.rollupOptions;
            expect(rollupOpts).to.not.equal(undefined);
            expect(rollupOpts?.preserveEntrySignatures).to.equal(expectedPropValue);
        };
        it('Should set preserveEntrySignatures to "exports-only" on build under the rollup options.', () => entrySignatureTest('build', 'exports-only'));
        it('Should set preserveEntrySignatures to false on serve under the rollup options.', () => entrySignatureTest('serve', false));
        const fileNamesTest = async (propName: keyof OutputOptions) => {
            // Arrange.
            const options: SingleSpaMifePluginOptions = { serverPort: 4111 };
            const plugIn = vitePluginSingleSpa(options);
            const env: ConfigEnv = { command: 'build', mode: 'development' };

            // Act.
            const config = await (plugIn.config as ConfigHandler)({}, env);

            // Assert.
            const outputOpts = config?.build?.rollupOptions?.output;
            expect(outputOpts).to.not.equal(undefined);
            const fileNameSetting = (outputOpts as OutputOptions)[propName];
            expect(fileNameSetting).to.not.match(/\[hash\]/);
        };
        it("Should set the output's asset file names to a hash-less pattern.", () => fileNamesTest('assetFileNames'));
        it("Should set the output's entry file names to a hash-less pattern.", () => fileNamesTest('entryFileNames'));
        const baseTest = async (options: SingleSpaMifePluginOptions, expectedBase: string) => {
            // Arrange.
            const plugIn = vitePluginSingleSpa(options);
            const env: ConfigEnv = { command: 'build', mode: 'development' };

            // Act.
            const config = await (plugIn.config as ConfigHandler)({}, env);

            // Assert.
            expect(config.base).to.equal(expectedBase);
        };
        const baseTestData: { config: SingleSpaMifePluginOptions, expectedBase: string }[] = [
            {
                config: { serverPort: 4444 },
                expectedBase: 'http://localhost:4444'
            },
            {
                config: { serverPort: 4444, deployedBase: '/custombase' },
                expectedBase: '/custombase'
            }
        ];
        for (let tc of baseTestData) {
            it(`Should set Vite's base property to "${tc.expectedBase}" when deployedBase is "${tc.config.deployedBase}".`, () => baseTest(tc.config, tc.expectedBase));
        }
    });
    describe('Root Configuration', () => {
        const configTest = async (viteCmd: ConfigEnv['command']) => {
            // Assert.
            const options: SingleSpaRootPluginOptions = { type: 'root' };
            const plugIn = vitePluginSingleSpa(options);
            const env: ConfigEnv = { command: viteCmd, mode: 'development' };

            // Act.
            const config = await (plugIn.config as ConfigHandler)({}, env);

            // Assert.
            expect(Object.keys(config)).to.have.length(0);
        };
        for (let cmd of viteCommands) {
            it(`Should return no configuration on ${cmd}.`, () => configTest(cmd));
        }
        const noImportMapTest = async (viteCmd: ConfigEnv['command']) => {
            // Arrange.
            const fileExists = (x: string) => false;
            const readFile = (x: string, opts: any) => Promise.reject();
            const plugin = pluginFactory(readFile, fileExists)({ type: 'root' });
            const env: ConfigEnv = { command: viteCmd, mode: 'development' };
            await (plugin.config as ConfigHandler)({}, env);
            const ctx = { path: '', filename: '' };

            // Act.
            const xForm = await (plugin.transformIndexHtml as { order: any, handler: IndexHtmlTransformHook }).handler('', ctx);

            // Assert.
            expect(xForm).to.not.equal(null);
            expect(xForm).to.not.equal(undefined);
            if (xForm && typeof xForm !== 'string' && !Array.isArray(xForm)) {
                expect(xForm.tags).to.have.lengthOf(0);
            }
            else {
                throw new Error('TypeScript narrowing suddenly routed the test elsewhere!');
            }
        };
        for (let cmd of viteCommands) {
            it(`Should not include any HTML tags into the HTML page if there is no import map file on ${cmd}.`, () => noImportMapTest(cmd));
        }
        it('Should not pick up the contents of "src/importMap.dev.json" if the file exists on build as the contents of the import map script.', async () => {
            const fileName = 'src/importMap.dev.json';
            const fileExists = (x: string) => x === fileName;
            const importMap = {
                imports: {
                    '@a/b': 'cd'
                },
                scopes: {
                    pickyModule: {
                        '@a/b': 'ef'
                    }
                }
            };
            let fileReadCount = 0;
            const readFile = (x: string, _opts: any) => {
                ++fileReadCount;
                if (x !== fileName) {
                    throw new Error(`File not found: ${x}`);
                }
                return Promise.resolve(JSON.stringify(importMap));
            }
            const plugin = pluginFactory(readFile, fileExists)({ type: 'root' });
            const env: ConfigEnv = { command: 'build', mode: 'production' };
            await (plugin.config as ConfigHandler)({}, env);
            const ctx = { path: '', filename: '' };

            // Act.
            const xForm = await (plugin.transformIndexHtml as { order: any, handler: IndexHtmlTransformHook }).handler('', ctx);

            // Assert.
            expect(fileReadCount).to.equal(0);
            expect(xForm).to.not.equal(null);
            expect(xForm).to.not.equal(undefined);
            if (xForm && typeof xForm !== 'string' && !Array.isArray(xForm)) {
                expect(xForm.tags).to.have.lengthOf(0);
            }
            else {
                throw new Error('TypeScript narrowing suddenly routed the test elsewhere!');
            }
        });
        const defaultImportMapTest = async (fileName: string, viteCmd: ConfigEnv['command']) => {
            // Arrange.
            const fileExists = (x: string) => x === fileName;
            const importMap = {
                imports: {
                    '@a/b': 'cd'
                },
                scopes: {
                    pickyModule: {
                        '@a/b': 'ef'
                    }
                }
            };
            let fileRead = false;
            let fileReadCount = 0;
            const readFile = (x: string, _opts: any) => {
                if (x === fileName) {
                    fileRead = true;
                }
                ++fileReadCount;
                return Promise.resolve(JSON.stringify(importMap));
            }
            const plugin = pluginFactory(readFile, fileExists)({ type: 'root' });
            const env: ConfigEnv = { command: viteCmd, mode: 'development' };
            await (plugin.config as ConfigHandler)({}, env);
            const ctx = { path: '', filename: '' };

            // Act.
            const xForm = await (plugin.transformIndexHtml as { order: any, handler: IndexHtmlTransformHook }).handler('', ctx);

            // Assert.
            expect(fileRead).to.equal(true);
            expect(fileReadCount).to.equal(1);
            expect(xForm).to.not.equal(null);
            expect(xForm).to.not.equal(undefined);
            if (xForm && typeof xForm !== 'string' && !Array.isArray(xForm)) {
                const firstTag = xForm.tags[0];
                expect(firstTag).to.not.equal(undefined);
                expect(firstTag.tag).to.equal('script');
                const parsedImportMap = JSON.parse(firstTag.children as string);
                expect(parsedImportMap).to.be.deep.equal(importMap);
            }
            else {
                throw new Error('TypeScript narrowing suddenly routed the test elsewhere!');
            }
        };
        const defaultImportMapTestData: { fileName: string, viteCmd: ConfigEnv['command'] }[] = [
            {
                fileName: 'src/importMap.dev.json',
                viteCmd: 'serve'
            },
            {
                fileName: 'src/importMap.json',
                viteCmd: 'serve'
            },
            {
                fileName: 'src/importMap.json',
                viteCmd: 'build'
            }
        ];
        for (let tc of defaultImportMapTestData) {
            it(`Should pick the contents of the default file "${tc.fileName}" if the file exists on ${tc.viteCmd} as the contents of the import map script.`, () => defaultImportMapTest(tc.fileName, tc.viteCmd));
        }
        const importMapTest = async (propertyName: string, viteCmd: ConfigEnv['command']) => {
            // Arrange.
            const fileName = 'customImportMap.json';
            const fileExists = (x: string) => x === fileName;
            const importMap = {
                imports: {
                    '@a/b': 'cd'
                },
                scopes: {
                    pickyModule: {
                        '@a/b': 'ef'
                    }
                }
            };
            let fileRead = false;
            let fileReadCount = 0;
            const readFile = (x: string, _opts: any) => {
                if (x === fileName) {
                    fileRead = true;
                }
                ++fileReadCount;
                return Promise.resolve(JSON.stringify(importMap));
            }
            const pluginOptions: SingleSpaRootPluginOptions = { type: 'root', importMaps: {} };
            // @ts-ignore
            pluginOptions.importMaps[propertyName] = fileName;
            const plugin = pluginFactory(readFile, fileExists)(pluginOptions);
            const env: ConfigEnv = { command: viteCmd, mode: 'development' };
            await (plugin.config as ConfigHandler)({}, env);
            const ctx = { path: '', filename: '' };

            // Act.
            const xForm = await (plugin.transformIndexHtml as { order: any, handler: IndexHtmlTransformHook }).handler('', ctx);

            // Assert.
            expect(fileRead).to.equal(true);
            expect(fileReadCount).to.equal(1);
            expect(xForm).to.not.equal(null);
            expect(xForm).to.not.equal(undefined);
            if (xForm && typeof xForm !== 'string' && !Array.isArray(xForm)) {
                const firstTag = xForm.tags[0];
                expect(firstTag).to.not.equal(undefined);
                expect(firstTag.tag).to.equal('script');
                const parsedImportMap = JSON.parse(firstTag.children as string);
                expect(parsedImportMap).to.be.deep.equal(importMap);
            }
            else {
                throw new Error('TypeScript narrowing suddenly routed the test elsewhere!');
            }
        };
        const importMapTestData: { propertyName: string, viteCmd: ConfigEnv['command'] }[] = [
            {
                propertyName: 'dev',
                viteCmd: 'serve'
            },
            {
                propertyName: 'build',
                viteCmd: 'build'
            }
        ];
        for (let tc of importMapTestData) {
            it(`Should pick the contents of the specified file in the "importMaps.${tc.propertyName}" configuration property on ${tc.viteCmd}.`, () => importMapTest(tc.propertyName, tc.viteCmd));
        }
        const importMapTypeTest = async (importMapType: ImportMapsOption['type'], viteCmd: ConfigEnv['command']) => {
            const fileExists = (_x: string) => true;
            const importMap = {
                imports: {
                    '@a/b': 'cd'
                },
                scopes: {
                    pickyModule: {
                        '@a/b': 'ef'
                    }
                }
            };
            const readFile = (_x: string, _opts: any) => Promise.resolve(JSON.stringify(importMap));
            const pluginOptions: SingleSpaRootPluginOptions = { type: 'root', importMaps: {} };
            pluginOptions.importMaps!.type = importMapType;
            const plugin = pluginFactory(readFile, fileExists)(pluginOptions);
            const env: ConfigEnv = { command: viteCmd, mode: 'development' };
            await (plugin.config as ConfigHandler)({}, env);
            const ctx = { path: '', filename: '' };

            // Act.
            const xForm = await (plugin.transformIndexHtml as { order: any, handler: IndexHtmlTransformHook }).handler('', ctx);

            // Assert.
            expect(xForm).to.not.equal(null);
            expect(xForm).to.not.equal(undefined);
            if (xForm && typeof xForm !== 'string' && !Array.isArray(xForm)) {
                const firstTag = xForm.tags[0];
                expect(firstTag).to.not.equal(undefined);
                expect(firstTag.tag).to.equal('script');
                expect(firstTag.attrs).to.not.equal(undefined);
                expect(firstTag.attrs!.type).to.equal(importMapType);
            }
            else {
                throw new Error('TypeScript narrowing suddenly routed the test elsewhere!');
            }
        };
        const importMapTypeTestData: ImportMapsOption['type'][] = [
            'importmap',
            'importmap-shim',
            'overridable-importmap',
            'systemjs-importmap'
        ];
        for (let cmd of viteCommands) {
            for (let t of importMapTypeTestData) {
                it(`Should set the import map type in the injected script tag to ${t} on ${cmd}.`, () => importMapTypeTest(t, cmd));
            }
        }
        const defaultImportMapTypeTest = async (viteCmd: ConfigEnv['command']) => {
            const fileExists = (_x: string) => true;
            const importMap = {
                imports: {
                    '@a/b': 'cd'
                },
                scopes: {
                    pickyModule: {
                        '@a/b': 'ef'
                    }
                }
            };
            const readFile = (_x: string, _opts: any) => Promise.resolve(JSON.stringify(importMap));
            const pluginOptions: SingleSpaRootPluginOptions = { type: 'root' };
            const plugin = pluginFactory(readFile, fileExists)(pluginOptions);
            const env: ConfigEnv = { command: viteCmd, mode: 'development' };
            await (plugin.config as ConfigHandler)({}, env);
            const ctx = { path: '', filename: '' };

            // Act.
            const xForm = await (plugin.transformIndexHtml as { order: any, handler: IndexHtmlTransformHook }).handler('', ctx);

            // Assert.
            expect(xForm).to.not.equal(null);
            expect(xForm).to.not.equal(undefined);
            if (xForm && typeof xForm !== 'string' && !Array.isArray(xForm)) {
                const firstTag = xForm.tags[0];
                expect(firstTag).to.not.equal(undefined);
                expect(firstTag.tag).to.equal('script');
                expect(firstTag.attrs).to.not.equal(undefined);
                expect(firstTag.attrs!.type).to.equal('overridable-importmap');
            }
            else {
                throw new Error('TypeScript narrowing suddenly routed the test elsewhere!');
            }
        };
        for (let cmd of viteCommands) {
            it(`Should set the import map type in the injected script tag to the default type "overridable-importmap" on ${cmd} when no type is specified.`, () => defaultImportMapTypeTest(cmd));
        }
    });
});
