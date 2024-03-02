/// <reference types="vite/client" />

let observer: MutationObserver | undefined;
let autoLinkEls: HTMLLinkElement[] = [];
const projectId = '{vpss:PROJECT_ID}';
const cssInjectedDictionary = '{vpss:CSS_MAP}';
const cssMap: Record<string, string[]> = JSON.parse(cssInjectedDictionary);
const cssFileMap: Record<string, { count: number, linkElement: HTMLLinkElement }> = {};
let base = import.meta.env.BASE_URL;
base += base.endsWith('/') ? '' : '/';
let autoLinksMounted = false;

export function cssLifecycleFactory(entryPoint: string) {
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

    function mount() {
        if (cssFileNames.length > 0) {
            for (let css of cssFileNames) {
                mountCssFile(css);
            }
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
 * Mounts the specified CSS filename as a CSS link element in the HEAD element.
 * @param cssFileName The CSS filename to be mounted.
 */
function mountCssFile(cssFileName: string) {
    let map = cssFileMap[cssFileName] ?? { count: 0 }
    if (map.count++ === 0 && !map.linkElement) {
        const el = globalThis.document.createElement('link');
        el.rel = 'stylesheet';
        el.href = base + cssFileName;
        el.setAttribute('data-vpss', 'true');
        globalThis.document.head.appendChild(el);
        map.linkElement = el;
    }
    map.linkElement.disabled = false;
    cssFileMap[cssFileName] = map;
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
    if (!map) {
        console.warn('A request to unmount CSS file %s was made, but said file has no file map.', cssFileName);
        return;
    }
    if (map.count <= 0) {
        console.warn('A request to unmount CSS file %s was made, but its count is already %d.', cssFileName, map.count);
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
