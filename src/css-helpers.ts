import { CssLifecycleFactoryOptions, ILogger } from "vite-plugin-single-spa/ex";

/**
 * Defines the return type of the promises generated to ensure CSS loading before micro-frontend mounting.
 */
export type LinkLoadResult = {
    /**
     * Status for the successful (or expected) result:  CSS loaded properly before the set timeout.
     */
    status: 'ok'
} | {
    /**
     * Status that indicates the CSS loading took too long to load (or maybe didn't load at all).
     */
    status: 'timeout';
    /**
     * CSS filename that was the subject of the timeout.
     */
    cssFileName: string;
} | {
    /**
     * Status that indicates an error occurred trying to fetch the CSS resource.
     */
    status: 'error';
    /**
     * CSS filename that was the subject of the error.
     */
    cssFileName: string;
    /**
     * Error event provided by the browser.
     */
    detail: ErrorEvent;
};

/**
 * Default CSS lifecycle factory options.  These values will take effect if no explicit overriding options are set 
 * while calling `cssLifecycleFactory()`.
 */
export const defaultFactoryOptions: Required<CssLifecycleFactoryOptions> = {
    logger: true,
    loadTimeout: 1500,
    failOnTimeout: false,
    failOnError: false
};

/**
 * Dud function to implement the silent logger.
 */
function noop() { };

/**
 * Silent logger used whenever no logging is desired.
 */
export const silentLogger: ILogger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop
};

/**
 * Module-level variable for the logger of choice.
 */
let logger: ILogger;

/**
 * Sets the logger object according to the given logging option.
 * @param option Desired logging option.
 */
export function setLogger(option: Required<CssLifecycleFactoryOptions>['logger']) {
    logger = option === true ? console : option === false ? silentLogger : option;
}

/**
 * Obtains a reference to the current logger object.
 * 
 * **NOTE**:  This logger object must have been previously set with a call to `setLogger()`.
 * @returns The current logger object.
 */
export function getLogger() {
    return logger;
}

/**
 * Create an HTML LINK element for a CSS resource that points to the given CSS URL.
 * @param href URL to the CSS file.
 * @returns The newly created HTML LINK element (unattached to the document).
 */
export function createLinkElement(href: string) {
    const el = globalThis.document.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    el.setAttribute('data-vpss', 'true');
    return el;
}

/**
 * Sets up the given HTML LINK element for loading/error monitoring for the purposes of avoiding **FOUC**.
 * @param el HTML LINK element to monitor.
 * @param cssFileName CSS filename associated to the LINK element.
 * @param projectId The micro-frontend's project ID.
 * @param loadTimeout The time in milliseconds to wait before declaring a loading timeout.
 * @returns A `LinkLoadResult` object that details the outcome of the monitoring process.
 */
export function wireCssLinkElement(el: HTMLLinkElement, cssFileName: string, projectId: string, loadTimeout: number) {
    let rslv: (result: LinkLoadResult) => void;
    const timerId = setTimeout(() => {
        logger.debug('CSS file "%s" for project with ID "%s" timed out and might have failed to load.  %d ms', cssFileName, projectId, loadTimeout);
        rslv({
            status: 'timeout',
            cssFileName
        });
        el.removeEventListener('load', loadHandler);
        el.removeEventListener('error', errorHandler);
    }, loadTimeout);
    const loadHandler = () => {
        logger.debug('CSS file "%s" loaded.', cssFileName);
        clearTimeout(timerId);
        rslv({ status: 'ok' });
        el.removeEventListener('load', loadHandler);
        el.removeEventListener('error', errorHandler);
    };
    const errorHandler = (ev: ErrorEvent) => {
        logger.debug('CSS file "%s" failed to load with error detail: %o', cssFileName, ev);
        clearTimeout(timerId);
        rslv({
            status: 'error',
            cssFileName,
            detail: ev
        });
        el.removeEventListener('error', errorHandler);
        el.removeEventListener('load', loadHandler);
    };
    el.addEventListener('error', errorHandler);
    el.addEventListener('load', loadHandler);
    return new Promise<LinkLoadResult>((rs) => {
        rslv = rs;
    });
};

/**
 * 
 * @param cssPromises List of CSS promises to process.
 * @param opts CSS lifecycle factory options that pertain to error behavior.
 * @returns An awaitable promise that will only reject if an error occurs while outside of the CSS waiting feature, or 
 * if the CSS lifecyle options are configured to throw an error.
 */
export async function processCssPromises(
    cssPromises: Promise<LinkLoadResult>[],
    opts: Required<Pick<CssLifecycleFactoryOptions, 'failOnError' | 'failOnTimeout'>>
) {
    try {
        await Promise.all(cssPromises);
    }
    catch (err) {
        return Promise.reject(err);
    }
    for (let cssPromise of cssPromises) {
        const result = await cssPromise;
        if (result.status === 'error') {
            if (opts.failOnError) {
                throw new Error(`CSS load failed for file "${result.cssFileName}".`, { cause: result.detail });
            }
            // Not failing on error, so log a warning.
            logger.warn('CSS load failed for file "%s": %s', result.cssFileName, result.detail.message);
        }
        else if (result.status === 'timeout') {
            const msg = `CSS load for file "${result.cssFileName}" timed out and might not have loaded.`;
            if (opts.failOnTimeout) {
                throw new Error(msg);
            }
            // Not failing on timeout, so log a warning.
            logger.warn(msg);
        }
    }
}
