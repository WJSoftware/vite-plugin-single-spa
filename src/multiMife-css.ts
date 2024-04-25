/// <reference types="vite/client" />

import { type CssLifecycleFactoryOptions } from "vite-plugin-single-spa/ex";
import { createLinkElement, defaultFactoryOptions, getLogger, processCssPromises, setLogger, wireCssLinkElement, type LinkLoadResult } from "./css-helpers.js";

let observer: MutationObserver | undefined;
let autoLinkEls: HTMLLinkElement[] = [];
const projectId = '{vpss:PROJECT_ID}';
const cssInjectedDictionary = '{vpss:CSS_MAP}';
const cssMap: Record<string, string[]> = JSON.parse(cssInjectedDictionary);
const cssFileMap: Record<string, { count: number, linkElement: HTMLLinkElement }> = {};
let base = import.meta.env.BASE_URL;
base += base.endsWith('/') ? '' : '/';
let autoLinksMounted = false;

export function cssLifecycleFactory(entryPoint: string, options?: CssLifecycleFactoryOptions) {
    const opts: Required<CssLifecycleFactoryOptions> = {
        ...defaultFactoryOptions,
        ...options
    };
    setLogger(opts.logger);
    const cssFileNames = cssMap[entryPoint] ?? [];

    return {
        bootstrap,
        mount,
        unmount
    };

    function bootstrap() {
        if (!observer) {
            observer = observeHead();
        }
        return Promise.resolve();
    }

    async function mount() {
        if (cssFileNames.length > 0) {
            const cssPromises = cssFileNames.map(css => mountCssFile(css, opts.loadTimeout));
            await processCssPromises(cssPromises, opts);
        }
        mountAutoCss();
        return Promise.resolve();
    }

    function unmount() {
        if (cssFileNames.length > 0) {
            for (let css of cssFileNames) {
                unmountCssFile(css);
            }
        }
        maybeUnmountAutoCss();
        return Promise.resolve();
    }
}

/**
 * Mounts the specified CSS filename as a CSS link element in the HEAD element.  The function returns a promise that 
 * resolves once the load event of the LINK element fires.
 * @param cssFileName The CSS filename to be mounted.
 */
function mountCssFile(cssFileName: string, loadTimeout: number) {
    return new Promise<LinkLoadResult>((rslv, _rjct) => {
        let map = cssFileMap[cssFileName] ?? { count: 0 };
        const firstTimeLoading = !map.linkElement;
        if (map.count++ === 0 && !map.linkElement) {
            map.linkElement = createLinkElement(base + cssFileName);
            globalThis.document.head.appendChild(map.linkElement);
        }
        map.linkElement.disabled = false;
        // The load event doesn't seem to fire for pre-existing elements that are merely re-enabled, even though a 
        // network request shows up in the Network tab of the browser's developer tools.
        if (!firstTimeLoading) {
            rslv({ status: 'ok' });
            return;
        }
        cssFileMap[cssFileName] = map;
        rslv(wireCssLinkElement(map.linkElement, cssFileName, projectId, loadTimeout));
    });
}

/**
 * Mounts all CSS link elements that have been inserted automatically by Vite's CSS splitting algorithm.
 */
function mountAutoCss() {
    if (autoLinksMounted) {
        return;
    }
    for (let el of autoLinkEls) {
        el.disabled = false;
    }
    autoLinksMounted = true;
}

/**
 * Unmounts the specified CSS filename from the HEAD element.
 * @param cssFileName The CSS filename to be unmounted.
 */
function unmountCssFile(cssFileName: string) {
    let map = cssFileMap[cssFileName];
    const logger = getLogger();
    if (!map) {
        logger.warn('A request to unmount CSS file %s was made, but said file has no file map.', cssFileName);
        return;
    }
    if (map.count <= 0) {
        logger.warn('A request to unmount CSS file %s was made, but its count is already %d.', cssFileName, map.count);
        return;
    }
    map.linkElement.disabled = --map.count === 0;
}

/**
 * Potentially unmounts all CSS link elements that Vite's CSS splitting algorithm may have mounted.
 */
function maybeUnmountAutoCss() {
    if (!autoLinksMounted) {
        return;
    }
    for (let [_, v] of Object.entries(cssFileMap)) {
        if (v.count > 0) {
            return;
        }
    }
    for (let el of autoLinkEls) {
        el.disabled = true;
    }
    autoLinksMounted = false;
}

/**
 * Determines if the given HTML node is a LINK element.
 * @param el HTML node to test.
 * @returns 
 */
function isLinkElement(el: Node): el is HTMLLinkElement {
    return el.nodeName === 'LINK';
}

/**
 * Starts an observation process to identify any CSS link elements that Vite's CSS splitting algorithm may auto-insert.
 * @returns The observer object that can be used to stop the observation process.
 */
function observeHead() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            if (m.addedNodes.length > 0) {
                m.addedNodes.forEach(an => {
                    if (isLinkElement(an) && an.rel === 'stylesheet' && an.href.includes(`vpss(${projectId})`) && !an.getAttribute('data-vpss')) {
                        autoLinkEls.push(an);
                    }
                });
            }
        });
    });
    observer.observe(globalThis?.document?.head, {
        childList: true
    });
    return observer;
}
