/// <reference types="vite/client" />

import { CssLifecycleFactoryOptions } from "vite-plugin-single-spa/ex";
import { createLinkElement, defaultFactoryOptions, processCssPromises, setLogger, wireCssLinkElement, type LinkLoadResult } from "./css-helpers.js";

let observer: MutationObserver | undefined;
let vpssLinkEls: HTMLLinkElement[];
let autoLinkEls: HTMLLinkElement[] = [];
const projectId = '{vpss:PROJECT_ID}';
const cssInjectedDictionary = '{vpss:CSS_MAP}';
const cssMap: Record<string, string[]> = JSON.parse(cssInjectedDictionary);
let base = import.meta.env.BASE_URL;
base += base.endsWith('/') ? '' : '/';
let bootstrappedElements: HTMLLinkElement[] | undefined;

function isLinkElement(el: Node): el is HTMLLinkElement {
    return el.nodeName === 'LINK';
}

function observeHead() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            if (m.addedNodes.length > 0) {
                m.addedNodes.forEach(an => {
                    if (isLinkElement(an) && an.rel === 'stylesheet' && an.href.includes(`vpss(${projectId})`)) {
                        (an.getAttribute('data-vpss') ? vpssLinkEls : autoLinkEls).push(an);
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

function cleanHeadElement(els?: HTMLLinkElement[]) {
    els?.forEach(el => globalThis.document.head.removeChild(el));
}

function bootstrap(cssFiles: string[]) {
    observer?.disconnect();
    observer = observeHead();
    cleanHeadElement(vpssLinkEls);
    cleanHeadElement(autoLinkEls);
    vpssLinkEls = [];
    autoLinkEls = [];
    bootstrappedElements = [];
    if (cssFiles.length === 0) {
        return Promise.resolve();
    }
    for (let css of cssFiles) {
        const el = createLinkElement(base + css);
        bootstrappedElements.push(el);
    }
    return Promise.resolve();
}

async function mount(cssFiles: string[], options: Required<CssLifecycleFactoryOptions>) {
    const loadPromises: Promise<LinkLoadResult>[] = [];
    let fileIndex = 0;
    if (bootstrappedElements) {
        for (let el of bootstrappedElements) {
            globalThis.document.head.appendChild(el);
            const promise = wireCssLinkElement(el, cssFiles[fileIndex++], projectId, options.loadTimeout);
            loadPromises.push(promise);
        }
        bootstrappedElements = undefined;
    }
    else {
        loadPromises.push(Promise.resolve({ status: 'ok' }));
    }
    if (cssFiles.length > 0) {
        for (let el of vpssLinkEls) {
            el.disabled = false;
        }
    }
    for (let el of autoLinkEls) {
        el.disabled = false;
    }
    await processCssPromises(loadPromises, options);
    return Promise.resolve();
}

function unmount(cssFiles: string[]) {
    if (cssFiles.length > 0) {
        for (let el of vpssLinkEls) {
            el.disabled = true;
        }
    }
    for (let el of autoLinkEls) {
        el.disabled = true;
    }
    return Promise.resolve();
}

export function cssLifecycleFactory(entryPoint: string, options?: CssLifecycleFactoryOptions) {
    const opts: Required<CssLifecycleFactoryOptions> = {
        ...defaultFactoryOptions,
        ...options
    };
    setLogger(opts.logger);
    const cssFiles = cssMap[entryPoint] ?? [];
    return {
        bootstrap: bootstrap.bind(null, cssFiles),
        mount: mount.bind(null, cssFiles, opts),
        unmount: unmount.bind(null, cssFiles)
    };
};
