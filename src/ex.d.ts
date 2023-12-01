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
     * Factory function that creates a `single-spa` CSS lifecycle object that manages the CSS files associated with 
     * the specified entry point.
     * 
     * Note that there is no need to call this multiple times if the entry point is the same.  In other words:  The 
     * returned object can be used for the lifecycles of many `single-spa` micro-frontends/parcels as long as they are 
     * exported from the same entry point file.
     * @param entryPoint Name of the entry point that dictates which CSS files the CSS lifecycle object will be 
     * managing.
     * @returns The `single-spa` lifecycle object capable of managing the entry point's CSS files.
     */
    export function cssLifecycleFactory(entryPoint: string): {
        bootstrap: LifeCycleFn<{}>;
        mount: LifeCycleFn<{}>;
        unmount: LifeCycleFn<{}>;
    };
}
