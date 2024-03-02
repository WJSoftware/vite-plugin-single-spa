/// <reference types="vite/client" />

let observer: MutationObserver | undefined;
let vpssLinkEls: HTMLLinkElement[];
let autoLinkEls: HTMLLinkElement[] = [];
const projectId = '{vpss:PROJECT_ID}';
const cssInjectedDictionary = '{vpss:CSS_MAP}';
const cssMap: Record<string, string[]> = JSON.parse(cssInjectedDictionary);
let base = import.meta.env.BASE_URL;
base += base.endsWith('/') ? '' : '/';

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
    if (cssFiles.length === 0) {
        return Promise.resolve();
    }
    for (let css of cssFiles) {
        const el = globalThis.document.createElement('link');
        el.rel = 'stylesheet';
        el.href = base + css;
        el.setAttribute('data-vpss', 'true');
        el.disabled = true;
        globalThis.document.head.appendChild(el);
    }
    return Promise.resolve();
}

function mount(cssFiles: string[]) {
    if (cssFiles.length > 0) {
        for (let el of vpssLinkEls) {
            el.disabled = false;
        }
    }
    for (let el of autoLinkEls) {
        el.disabled = false;
    }
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

export function cssLifecycleFactory(entryPoint: string) {
    const cssFiles = cssMap[entryPoint] ?? [];
    return {
        bootstrap: bootstrap.bind(null, cssFiles),
        mount: mount.bind(null, cssFiles),
        unmount: unmount.bind(null, cssFiles)
    };
};
