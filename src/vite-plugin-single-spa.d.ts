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
         * The path to the file that exports the single-spa lifecycle functions.
         */
        spaEntryPoint?: string;
        /**
         * Unique identifier given to the project.  It is used to tag CSS assets so the cssLifecyle object in 
         * the automatic module "vite-plugin-single-spa/ex" can properly manage the CSS lifecycle.
         * 
         * If not provided, the project's name (up to the first 20 letters) is used as identifier.
         */
        projectId?: string;
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
     * Defines the list of possible variants for the import-map-overrides user interface.  The Boolean value true is 
     * equivalent to the string 'full'.
     */
    export type ImoUiVariant = boolean | 'full' | 'popup' | 'list';

    /**
     * Defines the complete set of options available to configure the import-map-overrides user interface.
     */
    export type ImoUiOption = {
        /**
         * Desired variant of the user interface.  If not specified, the default value is 'full'.
         */
        variant?: ImoUiVariant;
        /**
         * Desired button position.  If not specified, the default value is 'bottom-right'.
         */
        buttonPos?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
        /**
         * Local storage key used to control the visibility of the import-map-overrides user interface.  If not 
         * specified, the defualt value is "imo-ui".
         */
        localStorageKey?: string;
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
        /**
         * Controls the inclusion of the import-map-overrides user interface.  Refer to the user interface 
         * documentation for the import-map-overrides package for full details.  The user interface is added unless 
         * explicitly deactivated in configuration.
         */
        imoUi?: ImoUiVariant | ImoUiOption;
    };

    /**
     * Defines the type for the plugin options object.
     */
    export type SingleSpaPluginOptions = SingleSpaRootPluginOptions | SingleSpaMifePluginOptions;
}
