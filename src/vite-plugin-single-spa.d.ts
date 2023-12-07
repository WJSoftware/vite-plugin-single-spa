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
        scopes?: Record<string, Record<string, string>>;
    };

    /**
     * Plug-in debugging options.
     */
    export type DebuggingOptions = {
        /**
         * Logging options.
         */
        logging?: {
            /**
             * Log's file name.  If not provided, `'vpss.log'` will be used if any of the logging flags is set to true.
             */
            fileName?: string;
            /**
             * Logs detailed information about the generated JavaScript chunks.
             */
            chunks?: boolean;
            /**
             * Logs the incoming Vite configuration (the one calculated before this plug-in modifies it).
             */
            incomingConfig?: boolean;
            /**
             * Logs the configuration changes proposed by this plug-in.
             */
            config?: boolean;
        }
    };

    /**
     * Defines the plugin options for Vite projects that are single-spa micro-frontends.
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
         * The path to the file that exports the single-spa lifecycle functions, or multiple paths for multiple exports 
         * in case parcels are being exported as well.
         */
        spaEntryPoints?: string | string[];
        /**
         * Unique identifier given to the project.  It is used to tag CSS assets so the cssLifecyle objects in the 
         * automatic module `vite-plugin-single-spa/ex` can properly identify the CSS resources associated to this 
         * project.
         * 
         * If not provided, the project's name (up to the first 20 letters) from `package.json` is used as identifier.
         */
        projectId?: string;
        /**
         * Specify the strategy to use by CSS lifecycle objects created with `cssLifecycleFactory()`.  If not 
         * specified, the default value is `singleMife`.
         * 
         * Use `singleMife` for single-spa micro-frontend projects that only export a single lifecycle object.  Use 
         * `multiMife` for single-spa micro-frontend projects that exports more than one lifecycle object, either from 
         * a single entry point, or from multiple entry points, such as a project that exports parcels, or a 
         * micro-frontend and one or more parcels.
         * 
         * Also use `multiMife` for single lifecycle exports if you intend to mount multiple copies of it 
         * simultaneously.
         * 
         * If you are not planning on using `cssLifecycleFactory()` for CSS mounting, you may use the `none` value; 
         * CSS bundle file names won't include the `vpss(project ID)` part as it is not necessary.
         * 
         * **WARNING**:  The single-spa library is not designed to mount multiple copies of the same micro-frontent or 
         * parcel, so be forewarned that the attempt may very well fail.  We recommend to only attempt to load 
         * multiple instances of **parcel** objects, not micro-frontends.  If you need to duplicate an entire 
         * micro-frontend, you'll be better off programming it as if it were a parcel and handle the mounting and 
         * unmounting yourself or through a proxy micro-frontend.
         */
        cssStrategy?: 'singleMife' | 'multiMife' | 'none';
        /**
         * Pattern that specifies how asset file names are constructed.  Its default value is 
         * `assets/[name]-[hash][extname]`.  As seen, it can specify sub-folders.
         * 
         * Refer to [Rollup's documentaiton](https://rollupjs.org/configuration-options/#output-assetfilenames) for 
         * additional information.
         * 
         * **IMPORTANT**:  When `cssStrategy` is not `'none'`, the CSS bundle file names will be in the form 
         * `vpss(<project id>)<pattern>`.  The plug-in is smart enough to respect any folders in the pattern.
         */
        assetFileNames?: string;
    } & DebuggingOptions;

    /**
     * Defines the posssible options for import maps in root projects.
     */
    export type ImportMapsOption = {
        /**
         * Type of importmap.  The valid values are `'importmap'`, `'overridable-importmap'`, `'systemjs-importmap'` 
         * and `'importmap-shim'`.
         */
        type?: 'importmap' | 'overridable-importmap' | 'systemjs-importmap' | 'importmap-shim';
        /**
         * File name or array of file names of the import map or maps to be used while developing.
         */
        dev?: string | string[];
        /**
         * File name or array of file names of the import map or maps to be used while building.
         */
        build?: string | string[];
    };

    /**
     * Defines the list of possible variants for the import-map-overrides user interface.  The Boolean value `true` is 
     * equivalent to the string `'full'`.
     */
    export type ImoUiVariant = boolean | 'full' | 'popup' | 'list';

    /**
     * Defines the complete set of options available to configure the import-map-overrides user interface.
     */
    export type ImoUiOption = {
        /**
         * Desired variant of the user interface.  If not specified, the default value is `'full'`.
         */
        variant?: ImoUiVariant;
        /**
         * Desired button position.  If not specified, the default value is `'bottom-right'`.
         */
        buttonPos?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
        /**
         * Local storage key used to control the visibility of the import-map-overrides user interface.  If not 
         * specified, the defualt value is `'imo-ui'`.
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
         * Controls the inclusion of the import-map-overrides package.  If set to `true`, or not specified at all, 
         * import-map-overrides will be included using the package's latest version.  In order to include a specific 
         * version, specify the version as a string (for example, `'2.4.2'`).
         * 
         * The package is served using the JSDelivr network; to use a different source, specify a function that 
         * returns the package's full URL as a string.
         */
        imo?: boolean | string | (() => string);
        /**
         * Controls the inclusion of the import-map-overrides user interface.  Refer to the user interface 
         * documentation for the import-map-overrides package for full details.  The user interface is added unless 
         * explicitly deactivated in configuration.
         */
        imoUi?: ImoUiVariant | ImoUiOption;
    } & DebuggingOptions;

    /**
     * Defines the type for the plugin options object.
     */
    export type SingleSpaPluginOptions = SingleSpaRootPluginOptions | SingleSpaMifePluginOptions;
}
