declare module "vite-plugin-single-spa" {
    import type { Plugin } from 'vite';
    /**
     * Vite plugin factory function that creates a plugin that configures Vite projects as single-spa projects.
     * @param config Plugin configuration object.
     * @returns Vite plugin.
     */
    export default function (config?: SingleSpaPluginOptions): Plugin;

    /**
     * Defines how import maps look like.
     */
    export type ImportMap = {
        imports?: Record<string, string>;
        scopes?: Record<string, string>;
    };

    /**
     * Defines the plugin options for Vite projects that are single-spa micro-frontentds.
     */
    export type SingleSpaMifePluginOptions = {
        /**
         * The type of single-spa project (micro-frontend or root).
         */
        type?: 'mife';
        /**
         * The server port for this micro-frontend.
         */
        serverPort: number;
        /**
         * If needed, specify the base URL when deploying under a nested public path.
         */
        deployedBase?: string;
        /**
         * The path to the file that exports the single-spa lifecycle functions.
         */
        spaEntryPoint?: string;
    };

    /**
     * Defines the posssible options for import maps in root projects.
     */
    export type ImportMapsOption = {
        /**
         * Type of importmap.  The valid values are 'importmap', 'overridable-importmap', 'systemjs-importmap' and 
         * 'importmap-shim'.
         */
        type?: 'importmap' | 'overridable-importmap' | 'systemjs-importmap' | 'importmap-shim';
        /**
         * File name of the import map to be used while developing.
         */
        dev?: string;
        /**
         * File name of the import map to be used while building.
         */
        build?: string;
    };

    /**
     * Defines the plugin options for Vite projects that are single-spa root projects (root configs).
     */
    export type SingleSpaRootPluginOptions = {
        /**
         * The type of single-spa project (micro-frontend or root).
         */
        type: 'root';
        /**
         * Importmap options.
         */
        importMaps?: ImportMapsOption;
        /**
         * Controls the inclusion of the import-map-overrides package.  If set to true, or not specified at all, 
         * import-map-overrides will be included using the package's latest version.  In order to include a specific 
         * version, specify the version as a string (for example, '2.4.2').
         * 
         * The package is served using the JSDelivr network; to use a different souce specify a function that returns 
         * the package's full URL as a string.
         */
        imo?: boolean | string | (() => string);
    };

    /**
     * Defines the type for the plugin options object.
     */
    export type SingleSpaPluginOptions = SingleSpaRootPluginOptions | SingleSpaMifePluginOptions;
}
