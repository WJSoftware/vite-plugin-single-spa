declare module 'vite-plugin-single-spa/ex' {
    import type { LifeCycleFn } from "single-spa";

    /**
     * Vite environment object with information about how Vite is running or ran.
     */
    export const viteEnv: {
        /**
         * Boolean value that will be true if the project is currently being served by Vite using "vite serve".
         */
        serving: boolean,
        /**
         * Boolean value that will be true if the project is the result of Vite building ("vite build").
         */
        built: boolean,
        /**
         * The mode Vite received with the current command ("serve" or "build").  It usuallly is the string 
         * "development" for "vite serve" and "production" for "vite build", but mode can really be set to anything.
         */
        mode: string
    };

    /**
     * Defines the functionality required from custom logger objects.  Custom loggers are used to customize how and 
     * what gets into the browser's console, if anything.
     */
    export type ILogger = {
        debug: Console['debug'];
        info: Console['info'];
        warn: Console['warn'];
        error: Console['error'];
    }

    /**
     * Options for the `cssLifecycleFactory` function.
     */
    export type CssLifecycleFactoryOptions = {
        /**
         * Specifies a logger object or a Boolean value that controls what gets logged to the browser's console.
         * 
         * Set it to `true` (or don't specify it at all) to log to the browser's console; set it to `false` to turn 
         * off all logging to the console, or use it to pass a custom logger object to arbitrarily handle logging.
         */
        logger?: boolean | ILogger;
        /**
         * Specifies the amount of time to wait for a CSS LINK element to load before potentially aborting the mount 
         * operation.
         * 
         * **NOTE**:  `single-spa` v6 (and probably previous versions) emit minified error message #31 if mounting 
         * takes more than 3000 milliseconds.  To avoid this error message, set this property to less than those 3000 
         * milliseconds.
         */
        loadTimeout?: number;
        /**
         * When set to `true`, a timeout event will abort the mount operation with a thrown error.
         */
        failOnTimeout?: boolean;
        /**
         * When set to `true`, an error event during CSS load will abort the mount operation with a thrown error.
         */
        failOnError?: boolean;
    };

    /**
     * Factory function that creates a `single-spa` CSS lifecycle object that manages the CSS files associated with 
     * the specified entry point.
     * 
     * Note that there is no need to call this multiple times if the entry point is the same.  In other words:  The 
     * returned object can be used for the lifecycles of many `single-spa` micro-frontends/parcels as long as they are 
     * exported from the same entry point file.
     * @param entryPoint Name of the entry point that dictates which CSS files the CSS lifecycle object will be 
     * managing.
     * @param options CSS lifecycle factory options.
     * @returns The `single-spa` lifecycle object capable of managing the entry point's CSS files.
     */
    export function cssLifecycleFactory(entryPoint: string, options?: CssLifecycleFactoryOptions): {
        bootstrap: LifeCycleFn<{}>;
        mount: LifeCycleFn<{}>;
        unmount: LifeCycleFn<{}>;
    };
}
