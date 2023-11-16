declare module 'vite-plugin-single-spa/ex' {
    import type { LifeCycles } from "single-spa";

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
     * single-spa CSS lifecycle object containing lifecycle functions that mount and unmount micro-frontend CSS.
     */
    export const cssLifecycleFactory: (entryPoint: string) => LifeCycles;
}
