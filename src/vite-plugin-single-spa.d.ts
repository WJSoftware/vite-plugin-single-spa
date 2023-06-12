import type { Plugin } from 'vite';

declare module 'vite-plugin-single-spa' {
    /**
     * Defines how import maps look like.
     */
    export type ImportMap = {
        imports?: Record<string, string>;
        scope?: Record<string, string>;
    };

    /**
     * Defines the plugin options for Vite projects that are single-spa micro-frontentds.
     */
    export type SingleSpaMifePluginOptions = {
        type?: 'mife';
        serverPort?: number;
        deployedBase?: string;
        spaEntryPoint?: string;
    };

    /**
     * Defines the plugin options for Vite projects that are single-spa root projects (root configs).
     */
    export type SingleSpaRootPluginOptions = {
        type: 'root';
        importMaps?: {
            type?: 'importmap' | 'overridable-importmap' | 'systemjs-importmap' | 'importmap-shim';
            dev?: string;
            build?: string;
        };
        includeImo?: boolean;
        imoVersion?: string;
    };

    /**
     * Defines the type for the plugin options object.
     */
    export type SingleSpaPluginOptions = SingleSpaRootPluginOptions | SingleSpaMifePluginOptions;


    /**
     * Vite plugin factory function that creates a plugin that configures Vite projects as single-spa projects.
     * @param config Plugin configuration object.
     * @returns Vite plugin.
     */
    export default function vitePluginSingleSpa(config?: SingleSpaPluginOptions): Plugin;

    /**
     * Vite plugin factory function that creates a plugin that configures Vite projects as single-spa projects.
     * @param config Plugin configuration object.
     * @returns Vite plugin.
     */
    export function vitePluginSingleSpa(config?: SingleSpaPluginOptions): Plugin;
}
